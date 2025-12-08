import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Network, 
  List, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Scroll,
  Download,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Sidebar = ({ collapsed, onToggle }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/entities?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleExport = async () => {
    try {
      const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
      const response = await fetch(`${API}/export`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'nexus_lore_export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/graph", icon: Network, label: "Mappa" },
    { to: "/entities", icon: List, label: "Entità" },
    { to: "/entities/new", icon: Plus, label: "Nuova Entità" },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      className="sidebar glass border-r border-white/10 flex flex-col"
      data-testid="sidebar"
    >
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <Scroll className="w-8 h-8 text-amber-500" />
              <span className="font-bold text-lg tracking-tight">Nexus Lore</span>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && <Scroll className="w-8 h-8 text-amber-500 mx-auto" />}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="shrink-0 hover:bg-white/10"
          data-testid="sidebar-toggle"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Search */}
      {!collapsed && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4"
          onSubmit={handleSearch}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca entità..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 focus:border-amber-500/50"
              data-testid="sidebar-search"
            />
          </div>
        </motion.form>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${collapsed ? 'justify-center' : ''} ${
                isActive
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`
            }
            data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Export Button */}
      <div className="p-4 border-t border-white/10">
        <Button
          variant="outline"
          onClick={handleExport}
          className={`w-full ${collapsed ? 'px-0' : ''} border-white/10 hover:bg-white/5`}
          data-testid="export-btn"
        >
          <Download className="w-4 h-4" />
          {!collapsed && <span className="ml-2">Esporta Dati</span>}
        </Button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
