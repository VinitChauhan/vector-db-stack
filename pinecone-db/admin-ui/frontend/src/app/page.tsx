// filepath: frontend/src/app/page.tsx
"use client";

import { useState } from "react";
import Indexes from "@/components/Indexes";
import Vectors from "@/components/Vectors";
import { 
  Database, 
  Activity, 
  ShieldCheck, 
  Cpu,
  Layers,
  ArrowRight
} from "lucide-react";

export default function Home() {
  const [selectedIndex, setSelectedIndex] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[20%] w-[35%] h-[35%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary rounded-2xl shadow-xl shadow-primary/20">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter sm:text-5xl">
                Pinecone<span className="text-primary">.Local</span>
              </h1>
            </div>
            <p className="text-muted-foreground text-lg font-medium max-w-lg">
              Manage your high-performance vector indexes with an ultra-responsive administrative console.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
             <div className="flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-2xl shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Local Cluster Active</span>
             </div>
             <div className="flex items-center gap-3 px-5 py-3 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Admin Access</span>
             </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Sidebar / Context */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Infrastructure</h3>
              <nav className="space-y-2">
                <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-transparent hover:border-border transition-all group cursor-default">
                   <div className="p-2 bg-secondary rounded-xl text-muted-foreground group-hover:text-primary transition-colors">
                      <Cpu className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold">Vector Engine</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Emulator v1.2.0</p>
                   </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-transparent hover:border-border transition-all group cursor-default">
                   <div className="p-2 bg-secondary rounded-xl text-muted-foreground group-hover:text-primary transition-colors">
                      <Activity className="w-5 h-5" />
                   </div>
                   <div>
                      <p className="text-sm font-bold">Cluster Health</p>
                      <p className="text-[10px] text-emerald-500 font-black uppercase">Optimal</p>
                   </div>
                </div>
              </nav>
            </div>

            <div className="p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-[32px] border border-primary/20 relative overflow-hidden group">
               <div className="relative z-10">
                  <h4 className="font-black text-lg mb-2">Need Help?</h4>
                  <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                    Check the Pinecone documentation for advanced querying and filtering syntax.
                  </p>
                  <a 
                    href="https://docs.pinecone.io" 
                    target="_blank" 
                    className="flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-3 transition-all"
                  >
                    View Docs
                    <ArrowRight className="w-3 h-3" />
                  </a>
               </div>
               <Layers className="absolute -bottom-4 -right-4 w-24 h-24 text-primary/10 rotate-12" />
            </div>
          </aside>

          {/* Main Area */}
          <section className="lg:col-span-3">
            {selectedIndex ? (
              <Vectors 
                indexName={selectedIndex} 
                onBack={() => setSelectedIndex(null)} 
              />
            ) : (
              <Indexes 
                selectedIndex={selectedIndex} 
                onSelectIndex={setSelectedIndex} 
              />
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-border flex flex-col md:flex-row justify-between gap-4 text-muted-foreground">
          <p className="text-sm font-medium">© 2026 Pinecone Local Administrative Interface</p>
          <div className="flex gap-6 text-xs font-bold uppercase tracking-widest">
            <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">Github</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
