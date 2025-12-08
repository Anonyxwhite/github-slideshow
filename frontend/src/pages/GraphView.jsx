import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ForceGraph2D from "react-force-graph-2d";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Filter, ZoomIn, ZoomOut, Maximize2, RefreshCw,
  Users, MapPin, Calendar, Package, Shield, Moon
} from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const entityColors = {
  character: "#3b82f6",
  place: "#10b981",
  event: "#f59e0b",
  object: "#8b5cf6",
  faction: "#ef4444",
  cult: "#db2777",
};

const entityIcons = {
  character: Users,
  place: MapPin,
  event: Calendar,
  object: Package,
  faction: Shield,
  cult: Moon,
};

const entityLabels = {
  character: "Personaggi",
  place: "Luoghi",
  event: "Eventi",
  object: "Oggetti",
  faction: "Fazioni",
  cult: "Culti",
};

export default function GraphView() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [filteredData, setFilteredData] = useState({ nodes: [], links: [] });
  const [filters, setFilters] = useState({
    character: true,
    place: true,
    event: true,
    object: true,
    faction: true,
    cult: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const graphRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    fetchGraphData();
  }, []);

  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const activeTypes = Object.entries(filters)
        .filter(([, active]) => active)
        .map(([type]) => type);
      
      const filteredNodes = graphData.nodes.filter((n) => activeTypes.includes(n.type));
      const nodeIds = new Set(filteredNodes.map((n) => n.id));
      const filteredLinks = graphData.links.filter(
        (l) => nodeIds.has(l.source?.id || l.source) && nodeIds.has(l.target?.id || l.target)
      );
      
      setFilteredData({ nodes: filteredNodes, links: filteredLinks });
    }
  }, [filters, graphData]);

  const fetchGraphData = async () => {
    try {
      const response = await axios.get(`${API}/graph`);
      setGraphData(response.data);
      setFilteredData(response.data);
    } catch (err) {
      console.error("Error fetching graph data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = useCallback((node) => {
    navigate(`/entities/${node.id}`);
  }, [navigate]);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  const handleZoomIn = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300);
  const handleZoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300);
  const handleCenter = () => graphRef.current?.zoomToFit(400);
  const handleRefresh = () => fetchGraphData();

  const toggleFilter = (type) => {
    setFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const nodeCanvasObject = useCallback((node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 12 / globalScale;
    const nodeSize = 8;
    const color = entityColors[node.type] || "#888";

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Draw glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw label
    ctx.font = `${fontSize}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff";
    ctx.fillText(label, node.x, node.y + nodeSize + fontSize);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="graph-view">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mappa delle Connessioni</h1>
          <p className="text-muted-foreground mt-1">
            {filteredData.nodes.length} nodi • {filteredData.links.length} collegamenti
          </p>
        </div>
      </div>

      {/* Graph Container */}
      <div className="graph-container relative">
        {/* HUD Controls */}
        <div className="graph-hud flex flex-col gap-2">
          <Card className="glass p-2 flex flex-col gap-1">
            <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCenter} title="Centra">
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRefresh} title="Aggiorna">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </Card>

          <Card className="glass p-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-amber-500/20 text-amber-500" : ""}
              title="Filtri"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-4 left-20 z-10"
          >
            <Card className="glass p-4 space-y-3">
              <h3 className="font-semibold text-sm">Filtra per Tipo</h3>
              {Object.entries(entityLabels).map(([type, label]) => {
                const Icon = entityIcons[type];
                return (
                  <div key={type} className="flex items-center gap-3">
                    <Checkbox
                      id={`filter-${type}`}
                      checked={filters[type]}
                      onCheckedChange={() => toggleFilter(type)}
                      data-testid={`filter-${type}`}
                    />
                    <Label 
                      htmlFor={`filter-${type}`} 
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Icon className="w-4 h-4" style={{ color: entityColors[type] }} />
                      <span>{label}</span>
                    </Label>
                  </div>
                );
              })}
            </Card>
          </motion.div>
        )}

        {/* Hovered Node Info */}
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 z-10"
          >
            <Card className="glass p-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entityColors[hoveredNode.type] }}
                />
                <div>
                  <p className="font-semibold">{hoveredNode.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {entityLabels[hoveredNode.type]} • {hoveredNode.theme}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 z-10">
          <Card className="glass p-3">
            <div className="flex flex-wrap gap-3">
              {Object.entries(entityLabels).map(([type, label]) => (
                <Badge 
                  key={type} 
                  variant="outline"
                  className="gap-1.5 border-white/20"
                  style={{ color: entityColors[type] }}
                >
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: entityColors[type] }} 
                  />
                  {label}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* Force Graph */}
        {filteredData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => {
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 12, 0, 2 * Math.PI);
              ctx.fill();
            }}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            linkColor={() => "rgba(255,255,255,0.15)"}
            linkWidth={1.5}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleColor={() => "rgba(212, 175, 55, 0.6)"}
            backgroundColor="transparent"
            width={typeof window !== 'undefined' ? window.innerWidth - 350 : 800}
            height={typeof window !== 'undefined' ? window.innerHeight - 150 : 600}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Nessuna entità da visualizzare. Crea alcune entità per vedere la mappa.</p>
          </div>
        )}
      </div>
    </div>
  );
}
