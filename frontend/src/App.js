import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import GraphView from "@/pages/GraphView";
import EntityList from "@/pages/EntityList";
import EntityDetail from "@/pages/EntityDetail";
import EntityEditor from "@/pages/EntityEditor";
import { useState } from "react";
import "@/App.css";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background" data-theme="default">
      <BrowserRouter>
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
        <main className={`${sidebarCollapsed ? 'main-content-expanded' : 'main-content'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/graph" element={<GraphView />} />
            <Route path="/entities" element={<EntityList />} />
            <Route path="/entities/new" element={<EntityEditor />} />
            <Route path="/entities/:id" element={<EntityDetail />} />
            <Route path="/entities/:id/edit" element={<EntityEditor />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" richColors />
      </BrowserRouter>
    </div>
  );
}

export default App;
