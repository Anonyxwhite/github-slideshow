import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { 
  ArrowLeft, Edit, Trash2, Link as LinkIcon, Tag,
  Users, MapPin, Calendar, Package, Shield, Moon,
  Clock, Palette
} from "lucide-react";
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

const themeStyles = {
  default: "bg-zinc-900",
  fantasy: "glass-fantasy",
  scifi: "glass-scifi",
};

export default function EntityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entity, setEntity] = useState(null);
  const [connectedEntities, setConnectedEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchEntity();
  }, [id]);

  const fetchEntity = async () => {
    try {
      const response = await axios.get(`${API}/entities/${id}`);
      setEntity(response.data);
      
      // Fetch connected entities
      if (response.data.connections?.length > 0) {
        const connectedIds = response.data.connections.map((c) => c.entity_id);
        const allEntities = await axios.get(`${API}/entities`);
        const connected = allEntities.data.filter((e) => connectedIds.includes(e.id));
        
        // Add relationship info
        const connectionsWithRelationship = connected.map((ce) => {
          const connection = response.data.connections.find((c) => c.entity_id === ce.id);
          return { ...ce, relationship: connection?.relationship || "" };
        });
        setConnectedEntities(connectionsWithRelationship);
      }
    } catch (err) {
      console.error("Error fetching entity:", err);
      toast.error("Entità non trovata");
      navigate("/entities");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/entities/${id}`);
      toast.success("Entità eliminata con successo");
      navigate("/entities");
    } catch (err) {
      toast.error("Errore nell'eliminazione dell'entità");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  if (!entity) return null;

  const Icon = entityIcons[entity.entity_type];
  const color = entityColors[entity.entity_type];

  return (
    <div data-theme={entity.theme} className="space-y-6" data-testid="entity-detail">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Indietro
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-8 ${themeStyles[entity.theme]} border border-white/10 relative overflow-hidden`}
      >
        {/* Background decoration based on theme */}
        {entity.theme === "fantasy" && (
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1694186502839-657cb8fd3d24?w=1200')] bg-cover bg-center" />
        )}
        {entity.theme === "scifi" && (
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1760978632014-f799595497af?w=1200')] bg-cover bg-center" />
        )}
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start gap-6">
          <div 
            className="p-4 rounded-2xl w-fit shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-12 h-12" style={{ color }} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <Badge style={{ backgroundColor: `${color}20`, color }}>
                {entityLabels[entity.entity_type]}
              </Badge>
              <Badge variant="outline" className="gap-1.5 border-white/20">
                <Palette className="w-3 h-3" />
                {entity.theme}
              </Badge>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {entity.name}
            </h1>
            
            {entity.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {entity.tags.map((tag) => (
                  <Link key={tag} to={`/entities?tag=${encodeURIComponent(tag)}`}>
                    <Badge 
                      variant="secondary" 
                      className="gap-1 cursor-pointer hover:bg-amber-500/20 hover:text-amber-500"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Aggiornato: {new Date(entity.updated_at).toLocaleDateString('it-IT')}
              </span>
              <span className="flex items-center gap-1">
                <LinkIcon className="w-4 h-4" />
                {entity.connections.length} collegamenti
              </span>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <Link to={`/entities/${id}/edit`}>
              <Button variant="outline" className="gap-2 border-white/20 hover:bg-white/10">
                <Edit className="w-4 h-4" />
                Modifica
              </Button>
            </Link>
            <Button 
              variant="destructive" 
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              data-testid="delete-entity-btn"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle>Contenuto</CardTitle>
            </CardHeader>
            <CardContent>
              {entity.content ? (
                <div 
                  className="prose prose-invert max-w-none"
                  data-theme={entity.theme}
                  dangerouslySetInnerHTML={{ __html: entity.content }}
                />
              ) : (
                <p className="text-muted-foreground italic">
                  Nessun contenuto ancora. 
                  <Link to={`/entities/${id}/edit`} className="text-amber-500 ml-1 hover:underline">
                    Aggiungi contenuto
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Image */}
          {entity.image_url && (
            <Card className="bg-zinc-900/50 border-white/10 overflow-hidden">
              <img 
                src={entity.image_url} 
                alt={entity.name}
                className="w-full h-48 object-cover"
              />
            </Card>
          )}

          {/* Connections */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LinkIcon className="w-4 h-4" />
                Collegamenti ({connectedEntities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {connectedEntities.length > 0 ? (
                <div className="space-y-3">
                  {connectedEntities.map((ce) => {
                    const CEIcon = entityIcons[ce.entity_type];
                    const ceColor = entityColors[ce.entity_type];
                    return (
                      <Link
                        key={ce.id}
                        to={`/entities/${ce.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                        data-testid={`connection-${ce.id}`}
                      >
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: `${ceColor}20` }}
                        >
                          <CEIcon className="w-4 h-4" style={{ color: ceColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{ce.name}</p>
                          {ce.relationship && (
                            <p className="text-xs text-muted-foreground truncate">
                              {ce.relationship}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun collegamento.
                  <Link to={`/entities/${id}/edit`} className="text-amber-500 block mt-1 hover:underline">
                    Aggiungi collegamenti
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Informazioni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <span>{entityLabels[entity.entity_type]}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tema</span>
                <span className="capitalize">{entity.theme}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tag</span>
                <span>{entity.tags.length}</span>
              </div>
              <Separator className="bg-white/10" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Creato</span>
                <span>{new Date(entity.created_at).toLocaleDateString('it-IT')}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questa entità?</AlertDialogTitle>
            <AlertDialogDescription>
              Questa azione non può essere annullata. L'entità "{entity.name}" 
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
