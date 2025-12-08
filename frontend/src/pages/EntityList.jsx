import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, Plus, Users, MapPin, Calendar, Package, Shield, Moon,
  LayoutGrid, List as ListIcon, Trash2, Edit
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const entityIcons = {
  character: Users,
  place: MapPin,
  event: Calendar,
  object: Package,
  faction: Shield,
  cult: Moon,
};

const entityColors = {
  character: "#3b82f6",
  place: "#10b981",
  event: "#f59e0b",
  object: "#8b5cf6",
  faction: "#ef4444",
  cult: "#db2777",
};

const entityLabels = {
  character: "Personaggio",
  place: "Luogo",
  event: "Evento",
  object: "Oggetto",
  faction: "Fazione",
  cult: "Culto",
};

export default function EntityList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [viewMode, setViewMode] = useState("grid");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);

  useEffect(() => {
    fetchEntities();
  }, [searchParams]);

  const fetchEntities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const search = searchParams.get("search");
      const type = searchParams.get("type");
      const tag = searchParams.get("tag");
      
      if (search) params.append("search", search);
      if (type && type !== "all") params.append("entity_type", type);
      if (tag) params.append("tag", tag);

      const response = await axios.get(`${API}/entities?${params.toString()}`);
      setEntities(response.data);
    } catch (err) {
      console.error("Error fetching entities:", err);
      toast.error("Errore nel caricamento delle entità");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  const handleTypeChange = (value) => {
    setTypeFilter(value);
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set("type", value);
    } else {
      params.delete("type");
    }
    setSearchParams(params);
  };

  const handleDelete = async () => {
    if (!entityToDelete) return;
    try {
      await axios.delete(`${API}/entities/${entityToDelete.id}`);
      toast.success("Entità eliminata con successo");
      fetchEntities();
    } catch (err) {
      toast.error("Errore nell'eliminazione dell'entità");
    } finally {
      setDeleteDialogOpen(false);
      setEntityToDelete(null);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6" data-testid="entity-list">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Entità</h1>
          <p className="text-muted-foreground mt-1">
            {entities.length} risultati
          </p>
        </div>
        <Link to="/entities/new">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
            <Plus className="w-4 h-4" />
            Nuova Entità
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-zinc-900/50 border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca entità..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" variant="secondary">
                Cerca
              </Button>
            </form>

            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[180px] bg-white/5 border-white/10" data-testid="type-filter">
                <SelectValue placeholder="Filtra per tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                {Object.entries(entityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1 border border-white/10 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entities Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-48 bg-zinc-900/50 border-white/10 animate-pulse" />
          ))}
        </div>
      ) : entities.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={viewMode === "grid" 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
            : "space-y-3"
          }
        >
          {entities.map((entity) => {
            const Icon = entityIcons[entity.entity_type];
            const color = entityColors[entity.entity_type];
            
            return (
              <motion.div key={entity.id} variants={itemVariants}>
                <Card 
                  className={`entity-card bg-zinc-900/50 border-white/10 hover:border-white/20 group ${
                    viewMode === "list" ? "flex items-center" : ""
                  }`}
                >
                  <Link 
                    to={`/entities/${entity.id}`} 
                    className={`block p-5 flex-1 ${viewMode === "list" ? "flex items-center gap-4" : ""}`}
                    data-testid={`entity-${entity.id}`}
                  >
                    <div 
                      className={`p-3 rounded-xl w-fit ${
                        viewMode === "list" ? "" : "mb-4"
                      }`}
                      style={{ backgroundColor: `${color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-amber-500">
                        {entity.name}
                      </h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {entityLabels[entity.entity_type]}
                      </p>
                      {entity.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entity.tags.slice(0, 3).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs border-white/10"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {entity.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs border-white/10">
                              +{entity.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge 
                      className="mt-3" 
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      {entity.theme}
                    </Badge>
                  </Link>
                  <div className={`flex gap-1 ${
                    viewMode === "list" ? "pr-4" : "px-5 pb-4"
                  }`}>
                    <Link to={`/entities/${entity.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.preventDefault();
                        setEntityToDelete(entity);
                        setDeleteDialogOpen(true);
                      }}
                      data-testid={`delete-${entity.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <Card className="bg-zinc-900/50 border-white/10 p-12 text-center">
          <p className="text-muted-foreground mb-4">Nessuna entità trovata</p>
          <Link to="/entities/new">
            <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-black">
              <Plus className="w-4 h-4" />
              Crea la prima entità
            </Button>
          </Link>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa entità?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'entità "{entityToDelete?.name}" 
              sarà eliminata permanentemente insieme a tutti i suoi collegamenti.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
