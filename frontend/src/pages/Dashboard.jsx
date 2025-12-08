import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, MapPin, Calendar, Package, Shield, Moon,
  Plus, ArrowRight, Network, Sparkles
} from "lucide-react";
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
  character: "Personaggi",
  place: "Luoghi",
  event: "Eventi",
  object: "Oggetti",
  faction: "Fazioni",
  cult: "Culti",
};

export default function Dashboard() {
  const [stats, setStats] = useState({ by_type: {}, total: 0 });
  const [recentEntities, setRecentEntities] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, entitiesRes, tagsRes] = await Promise.all([
          axios.get(`${API}/stats`),
          axios.get(`${API}/entities`),
          axios.get(`${API}/tags`),
        ]);
        setStats(statsRes.data);
        setRecentEntities(entitiesRes.data.slice(0, 6));
        setTags(tagsRes.data.slice(0, 10));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="w-12 h-12 text-amber-500 animate-spin" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
      data-testid="dashboard"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Gestisci il tuo universo narrativo
          </p>
        </div>
        <Link to="/entities/new">
          <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold" data-testid="new-entity-btn">
            <Plus className="w-4 h-4" />
            Nuova Entità
          </Button>
        </Link>
      </motion.div>

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Stats Overview - Large */}
        <motion.div variants={itemVariants} className="bento-item-large">
          <Card className="h-full bg-gradient-to-br from-zinc-900 to-zinc-800 border-white/10 overflow-hidden relative">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.15),transparent_50%)]" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Network className="w-5 h-5 text-amber-500" />
                Panoramica del Mondo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(entityLabels).map((type) => {
                  const Icon = entityIcons[type];
                  const count = stats.by_type[type] || 0;
                  return (
                    <Link 
                      key={type} 
                      to={`/entities?type=${type}`}
                      className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5"
                    >
                      <div 
                        className="p-2 rounded-lg" 
                        style={{ backgroundColor: `${entityColors[type]}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: entityColors[type] }} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm text-muted-foreground">{entityLabels[type]}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">{stats.total}</p>
                  <p className="text-muted-foreground">Entità Totali</p>
                </div>
                <Link to="/graph">
                  <Button variant="outline" className="gap-2 border-white/20 hover:bg-white/10">
                    Visualizza Mappa
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Entities */}
        <motion.div variants={itemVariants} className="bento-item-wide">
          <Card className="h-full bg-zinc-900/50 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Entità Recenti</CardTitle>
              <Link to="/entities">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                  Vedi tutte <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentEntities.length > 0 ? (
                <div className="space-y-3">
                  {recentEntities.slice(0, 4).map((entity) => {
                    const Icon = entityIcons[entity.entity_type];
                    return (
                      <Link
                        key={entity.id}
                        to={`/entities/${entity.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10"
                      >
                        <div 
                          className="p-2 rounded-lg" 
                          style={{ backgroundColor: `${entityColors[entity.entity_type]}20` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: entityColors[entity.entity_type] }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{entity.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{entityLabels[entity.entity_type]}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="shrink-0 text-xs border-white/10"
                          style={{ color: entityColors[entity.entity_type] }}
                        >
                          {entity.theme}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nessuna entità ancora.</p>
                  <Link to="/entities/new">
                    <Button variant="link" className="text-amber-500 mt-2">
                      Crea la prima entità
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(entityLabels).slice(0, 4).map(([type, label]) => {
                const Icon = entityIcons[type];
                return (
                  <Link key={type} to={`/entities/new?type=${type}`}>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start gap-3 hover:bg-white/5"
                    >
                      <Icon className="w-4 h-4" style={{ color: entityColors[type] }} />
                      <span>Nuovo {label.slice(0, -1)}</span>
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Tags Cloud */}
        <motion.div variants={itemVariants}>
          <Card className="h-full bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Tag Popolari</CardTitle>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Link key={tag.tag} to={`/entities?tag=${encodeURIComponent(tag.tag)}`}>
                      <Badge 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-amber-500/20 hover:text-amber-500"
                      >
                        {tag.tag} ({tag.count})
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun tag ancora
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
