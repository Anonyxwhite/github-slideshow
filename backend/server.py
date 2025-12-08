from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Nexus Lore API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Entity Types
ENTITY_TYPES = ["character", "place", "event", "object", "faction", "cult"]
THEME_TYPES = ["fantasy", "scifi", "default"]

# Models
class Connection(BaseModel):
    entity_id: str
    relationship: str = ""

class EntityBase(BaseModel):
    name: str
    entity_type: str
    content: str = ""
    theme: str = "default"
    tags: List[str] = []
    connections: List[Connection] = []
    image_url: Optional[str] = None

class EntityCreate(EntityBase):
    pass

class EntityUpdate(BaseModel):
    name: Optional[str] = None
    entity_type: Optional[str] = None
    content: Optional[str] = None
    theme: Optional[str] = None
    tags: Optional[List[str]] = None
    connections: Optional[List[Connection]] = None
    image_url: Optional[str] = None

class Entity(EntityBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EntityResponse(BaseModel):
    id: str
    name: str
    entity_type: str
    content: str
    theme: str
    tags: List[str]
    connections: List[Connection]
    image_url: Optional[str]
    created_at: str
    updated_at: str

# Health check
@api_router.get("/")
async def root():
    return {"message": "Nexus Lore API is running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Entity CRUD
@api_router.post("/entities", response_model=EntityResponse)
async def create_entity(entity: EntityCreate):
    if entity.entity_type not in ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid entity type. Must be one of: {ENTITY_TYPES}")
    if entity.theme not in THEME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid theme. Must be one of: {THEME_TYPES}")
    
    entity_obj = Entity(**entity.model_dump())
    doc = entity_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    doc['connections'] = [c.model_dump() for c in entity_obj.connections]
    
    await db.entities.insert_one(doc)
    return EntityResponse(**doc)

@api_router.get("/entities", response_model=List[EntityResponse])
async def get_entities(
    entity_type: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    entities = await db.entities.find(query, {"_id": 0}).to_list(1000)
    return [EntityResponse(**e) for e in entities]

@api_router.get("/entities/{entity_id}", response_model=EntityResponse)
async def get_entity(entity_id: str):
    entity = await db.entities.find_one({"id": entity_id}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return EntityResponse(**entity)

@api_router.put("/entities/{entity_id}", response_model=EntityResponse)
async def update_entity(entity_id: str, update: EntityUpdate):
    entity = await db.entities.find_one({"id": entity_id}, {"_id": 0})
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    update_data = update.model_dump(exclude_unset=True)
    if 'entity_type' in update_data and update_data['entity_type'] not in ENTITY_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid entity type")
    if 'theme' in update_data and update_data['theme'] not in THEME_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid theme")
    
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    if 'connections' in update_data:
        update_data['connections'] = [c if isinstance(c, dict) else c.model_dump() for c in update_data['connections']]
    
    await db.entities.update_one({"id": entity_id}, {"$set": update_data})
    updated = await db.entities.find_one({"id": entity_id}, {"_id": 0})
    return EntityResponse(**updated)

@api_router.delete("/entities/{entity_id}")
async def delete_entity(entity_id: str):
    result = await db.entities.delete_one({"id": entity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    # Remove connections to this entity from other entities
    await db.entities.update_many(
        {},
        {"$pull": {"connections": {"entity_id": entity_id}}}
    )
    return {"message": "Entity deleted successfully"}

# Graph data endpoint
@api_router.get("/graph")
async def get_graph_data(entity_type: Optional[str] = Query(None)):
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    
    entities = await db.entities.find(query, {"_id": 0}).to_list(1000)
    
    nodes = []
    links = []
    entity_ids = {e["id"] for e in entities}
    
    for e in entities:
        nodes.append({
            "id": e["id"],
            "name": e["name"],
            "type": e["entity_type"],
            "theme": e.get("theme", "default")
        })
        for conn in e.get("connections", []):
            if conn["entity_id"] in entity_ids:
                links.append({
                    "source": e["id"],
                    "target": conn["entity_id"],
                    "relationship": conn.get("relationship", "")
                })
    
    return {"nodes": nodes, "links": links}

# Export endpoint
@api_router.get("/export")
async def export_data():
    entities = await db.entities.find({}, {"_id": 0}).to_list(10000)
    return JSONResponse(
        content={"entities": entities, "exported_at": datetime.now(timezone.utc).isoformat()},
        headers={"Content-Disposition": "attachment; filename=nexus_lore_export.json"}
    )

# Stats endpoint
@api_router.get("/stats")
async def get_stats():
    pipeline = [
        {"$group": {"_id": "$entity_type", "count": {"$sum": 1}}}
    ]
    results = await db.entities.aggregate(pipeline).to_list(100)
    stats = {r["_id"]: r["count"] for r in results}
    total = sum(stats.values())
    return {"by_type": stats, "total": total}

# Tags endpoint
@api_router.get("/tags")
async def get_all_tags():
    pipeline = [
        {"$unwind": "$tags"},
        {"$group": {"_id": "$tags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    results = await db.entities.aggregate(pipeline).to_list(1000)
    return [{"tag": r["_id"], "count": r["count"]} for r in results]

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
