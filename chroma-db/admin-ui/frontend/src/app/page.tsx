"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Collections from "@/components/Collections";
import Documents from "@/components/Documents";
import Search from "@/components/Search";
import Stats from "@/components/Stats";
import Settings from "@/components/Settings";

type Tab = "collections" | "documents" | "search" | "stats" | "settings";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("collections");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">
          {activeTab === "collections" && (
            <Collections 
              selectedCollection={selectedCollection}
              onSelectCollection={(name) => {
                setSelectedCollection(name);
                if (name) setActiveTab("documents");
              }}
            />
          )}
          {activeTab === "documents" && (
            <Documents 
              collectionName={selectedCollection}
              onBack={() => setActiveTab("collections")}
            />
          )}
          {activeTab === "search" && (
            <Search 
              selectedCollection={selectedCollection}
              onSelectCollection={setSelectedCollection}
            />
          )}
          {activeTab === "stats" && <Stats />}
          {activeTab === "settings" && <Settings />}
        </div>
      </main>
    </div>
  );
}