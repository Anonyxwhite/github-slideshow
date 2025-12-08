import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Quote, Code, Image as ImageIcon,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight,
  Heading1, Heading2, Heading3, Undo, Redo, Save, X, Plus,
  Users, MapPin, Calendar, Package, Shield, Moon
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const entityTypes = [
  { value: "character", label: "Personaggio", icon: Users },
  { value: "place", label: "Luogo", icon: MapPin },
  { value: "event", label: "Evento", icon: Calendar },
  { value: "object", label: "Oggetto", icon: Package },
  { value: "faction", label: "Fazione", icon: Shield },
  { value: "cult", label: "Culto", icon: Moon },
];

const themes = [
  { value: "default", label: "Default" },
  { value: "fantasy", label: "Fantasy / Medievale" },
  { value: "scifi", label: "Sci-Fi / Futuristico" },
];

const entityColors = {
  character: "#3b82f6",
  place: "#10b981",
  event: "#f59e0b",
  object: "#8b5cf6",
  faction: "#ef4444",
  cult: "#db2777",
};

export default function EntityEditor() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    entity_type: searchParams.get("type") || "character",
    theme: "default",
    image_url: "",
    tags: [],
    connections: [],
  });
  const [newTag, setNewTag] = useState("");
  const [allEntities, setAllEntities] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Inizia a scrivere la tua lore..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap focus:outline-none min-h-[300px]",
      },
    },
  });

  useEffect(() => {
    fetchAllEntities();
    if (isEditing) {
      fetchEntity();
    }
  }, [id]);

  const fetchEntity = async () => {
    try {
      const response = await axios.get(`${API}/entities/${id}`);
      const entity = response.data;
      setFormData({
        name: entity.name,
        entity_type: entity.entity_type,
        theme: entity.theme,
        image_url: entity.image_url || "",
        tags: entity.tags || [],
        connections: entity.connections || [],
      });
      if (editor && entity.content) {
        editor.commands.setContent(entity.content);
      }
    } catch (err) {
      toast.error("Errore nel caricamento dell'entità");
      navigate("/entities");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEntities = async () => {
    try {
      const response = await axios.get(`${API}/entities`);
      setAllEntities(response.data.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Error fetching entities:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Il nome è obbligatorio");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        content: editor?.getHTML() || "",
      };

      if (isEditing) {
        await axios.put(`${API}/entities/${id}`, payload);
        toast.success("Entità aggiornata con successo");
      } else {
        const response = await axios.post(`${API}/entities`, payload);
        toast.success("Entità creata con successo");
        navigate(`/entities/${response.data.id}`);
        return;
      }
      navigate(`/entities/${id}`);
    } catch (err) {
      toast.error(isEditing ? "Errore nell'aggiornamento" : "Errore nella creazione");
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  const toggleConnection = (entityId, relationship = "") => {
    const existing = formData.connections.find((c) => c.entity_id === entityId);
    if (existing) {
      setFormData({
        ...formData,
        connections: formData.connections.filter((c) => c.entity_id !== entityId),
      });
    } else {
      setFormData({
        ...formData,
        connections: [...formData.connections, { entity_id: entityId, relationship }],
      });
    }
  };

  const updateRelationship = (entityId, relationship) => {
    setFormData({
      ...formData,
      connections: formData.connections.map((c) =>
        c.entity_id === entityId ? { ...c, relationship } : c
      ),
    });
  };

  const addImageUrl = useCallback(() => {
    const url = window.prompt("URL dell'immagine:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addLink = useCallback(() => {
    const url = window.prompt("URL del link:");
    if (url && editor) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Caricamento...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="entity-editor"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isEditing ? "Modifica Entità" : "Nuova Entità"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing ? "Modifica i dettagli dell'entità" : "Crea una nuova entità nel tuo mondo"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="border-white/20"
          >
            <X className="w-4 h-4 mr-2" />
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            data-testid="save-entity-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvataggio..." : "Salva"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle>Informazioni Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome dell'entità"
                  className="bg-white/5 border-white/10"
                  data-testid="entity-name-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.entity_type}
                    onValueChange={(value) => setFormData({ ...formData, entity_type: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10" data-testid="entity-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entityTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" style={{ color: entityColors[type.value] }} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={formData.theme}
                    onValueChange={(value) => setFormData({ ...formData, theme: value })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10" data-testid="entity-theme-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme.value} value={theme.value}>
                          {theme.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">URL Immagine (opzionale)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://esempio.com/immagine.jpg"
                  className="bg-white/5 border-white/10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rich Text Editor */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle>Contenuto</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Toolbar */}
              <div className="editor-toolbar">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={editor?.isActive("bold") ? "is-active" : ""}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={editor?.isActive("italic") ? "is-active" : ""}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={editor?.isActive("underline") ? "is-active" : ""}
                >
                  <UnderlineIcon className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                  className={editor?.isActive("strike") ? "is-active" : ""}
                >
                  <Strikethrough className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/10 mx-1" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                  className={editor?.isActive("heading", { level: 1 }) ? "is-active" : ""}
                >
                  <Heading1 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  className={editor?.isActive("heading", { level: 2 }) ? "is-active" : ""}
                >
                  <Heading2 className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  className={editor?.isActive("heading", { level: 3 }) ? "is-active" : ""}
                >
                  <Heading3 className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/10 mx-1" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={editor?.isActive("bulletList") ? "is-active" : ""}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={editor?.isActive("orderedList") ? "is-active" : ""}
                >
                  <ListOrdered className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                  className={editor?.isActive("blockquote") ? "is-active" : ""}
                >
                  <Quote className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
                  className={editor?.isActive("codeBlock") ? "is-active" : ""}
                >
                  <Code className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/10 mx-1" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                  className={editor?.isActive({ textAlign: "left" }) ? "is-active" : ""}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                  className={editor?.isActive({ textAlign: "center" }) ? "is-active" : ""}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                  className={editor?.isActive({ textAlign: "right" }) ? "is-active" : ""}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/10 mx-1" />
                
                <Button type="button" variant="ghost" size="icon" onClick={addLink}>
                  <LinkIcon className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="icon" onClick={addImageUrl}>
                  <ImageIcon className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-6 bg-white/10 mx-1" />
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().undo().run()}
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => editor?.chain().focus().redo().run()}
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Editor */}
              <div className="bg-white/5 rounded-b-lg border border-white/10 border-t-0" data-testid="rich-text-editor">
                <EditorContent editor={editor} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Tag</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Aggiungi tag"
                  className="bg-white/5 border-white/10"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  data-testid="tag-input"
                />
                <Button type="button" variant="secondary" onClick={addTag}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-red-500/20 hover:text-red-400"
                      onClick={() => removeTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connections */}
          <Card className="bg-zinc-900/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Collegamenti</CardTitle>
            </CardHeader>
            <CardContent>
              {allEntities.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {allEntities.map((entity) => {
                      const isConnected = formData.connections.some(
                        (c) => c.entity_id === entity.id
                      );
                      const connection = formData.connections.find(
                        (c) => c.entity_id === entity.id
                      );
                      const EntityIcon = entityTypes.find(
                        (t) => t.value === entity.entity_type
                      )?.icon || Users;
                      
                      return (
                        <div
                          key={entity.id}
                          className={`p-3 rounded-lg border ${
                            isConnected
                              ? "bg-amber-500/10 border-amber-500/30"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isConnected}
                              onCheckedChange={() => toggleConnection(entity.id)}
                              data-testid={`connect-${entity.id}`}
                            />
                            <EntityIcon
                              className="w-4 h-4"
                              style={{ color: entityColors[entity.entity_type] }}
                            />
                            <span className="flex-1 truncate text-sm">
                              {entity.name}
                            </span>
                          </div>
                          {isConnected && (
                            <Input
                              value={connection?.relationship || ""}
                              onChange={(e) =>
                                updateRelationship(entity.id, e.target.value)
                              }
                              placeholder="Tipo di relazione"
                              className="mt-2 bg-white/5 border-white/10 text-xs h-8"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna altra entità disponibile per il collegamento.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </motion.div>
  );
}
