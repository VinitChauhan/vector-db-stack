"use client";

import { 
  Database, 
  FileText, 
  Search, 
  BarChart3, 
  Settings,
  ChevronRight
} from "lucide-react";
import clsx from "clsx";

type Tab = "collections" | "documents" | "search" | "stats" | "settings";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs = [
  { id: "collections" as Tab, label: "Collections", icon: Database },
  { id: "documents" as Tab, label: "Documents", icon: FileText },
  { id: "search" as Tab, label: "Search", icon: Search },
  { id: "stats" as Tab, label: "Statistics", icon: BarChart3 },
  { id: "settings" as Tab, label: "Settings", icon: Settings },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold text-primary">ChromaDB Admin</h1>
        <p className="text-sm text-muted-foreground">Vector Database Manager</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <p>Backend: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}</p>
        </div>
      </div>
    </aside>
  );
}