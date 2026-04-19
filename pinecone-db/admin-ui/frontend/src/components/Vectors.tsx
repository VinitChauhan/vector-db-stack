// filepath: frontend/src/components/Vectors.tsx
"use client";

import { useState, useEffect } from "react";
import { vectorsApi } from "@/lib/api";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileText,
  Loader2,
  Search,
  Database,
  Hash,
  Binary,
  Layers
} from "lucide-react";
import clsx from "clsx";

interface VectorsProps {
  indexName: string | null;
  onBack: () => void;
}

interface VectorMatch {
  id: string;
  score: number;
  values?: number[];
  metadata: Record<string, unknown> | null;
}

export default function Vectors({ indexName, onBack }: VectorsProps) {
  const [matches, setMatches] = useState<VectorMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [namespace, setNamespace] = useState("");
  const [queryText, setQueryText] = useState("");
  const [searching, setSearching] = useState(false);
  
  const [showUpsertModal, setShowUpsertModal] = useState(false);
  const [upserting, setUpserting] = useState(false);
  const [upsertData, setUpsertData] = useState({
    id: "",
    namespace: "",
    metadata: "",
    values: ""
  });

  const handleQuery = async () => {
    if (!indexName) return;
    setLoading(true);
    setError(null);
    setSearching(true);
    try {
      const res = await vectorsApi.query(indexName, {
        query_text: queryText,
        namespace: namespace || "",
        top_k: 20,
        include_metadata: true,
        include_values: false
      });
      setMatches(res.data.matches);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Query failed");
      console.error(err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const handleUpsert = async () => {
    if (!indexName || !upsertData.id || !upsertData.values) return;
    setUpserting(true);
    setError(null);
    try {
      const values = upsertData.values.split(",").map(v => parseFloat(v.trim()));
      let metadata = {};
      if (upsertData.metadata) {
        metadata = JSON.parse(upsertData.metadata);
      }

      await vectorsApi.upsert(indexName, {
        ids: [upsertData.id],
        values: [values],
        metadatas: [metadata],
        namespace: upsertData.namespace || ""
      });
      
      setShowUpsertModal(false);
      setUpsertData({ id: "", namespace: "", metadata: "", values: "" });
      handleQuery();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Upsert failed");
    } finally {
      setUpserting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!indexName || !confirm(`Delete vector ${id}?`)) return;
    try {
      await vectorsApi.delete(indexName, { ids: [id], namespace });
      handleQuery();
    } catch (err) {
      setError("Delete failed");
    }
  };

  if (!indexName) return null;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2.5 hover:bg-muted rounded-xl transition-all w-fit border border-transparent hover:border-border"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-black tracking-tight">{indexName}</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Vector Explorer</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button
            onClick={() => setShowUpsertModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Upsert Vector
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-3">
             <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">Namespace</label>
             <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={namespace}
                  onChange={(e) => setNamespace(e.target.value)}
                  placeholder="Default (None)"
                  className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                />
             </div>
          </div>
          <div className="md:col-span-7">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1 mb-1 block">Search Query</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                placeholder="Describe what you're looking for..."
                className="w-full pl-10 pr-4 py-3 bg-muted/30 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
              />
            </div>
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleQuery}
              disabled={loading || !queryText.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Search
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl text-sm italic">
          {error}
        </div>
      )}

      {loading && matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 animate-pulse">
           <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
           <p className="text-muted-foreground">Running semantic search...</p>
        </div>
      ) : matches.length === 0 && !loading ? (
        <div className="text-center py-24 bg-muted/5 rounded-[40px] border-2 border-dashed border-border/60">
           <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-muted-foreground opacity-40" />
           </div>
           <h3 className="text-xl font-bold mb-2">Ready to Search</h3>
           <p className="text-muted-foreground max-w-sm mx-auto">Enter a natural language query above to find relevant vectors in your index using local embeddings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              Found {matches.length} Results
            </p>
          </div>
          {matches.map((match) => (
            <div
              key={match.id}
              className="group p-6 rounded-[32px] bg-card border border-border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-secondary/50 text-secondary-foreground rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Binary className="w-6 h-6" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-black text-xl tracking-tight mb-1">{match.id}</h4>
                      <div className="flex items-center gap-3">
                         <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                           Match: {(match.score * 100).toFixed(1)}%
                         </span>
                         {namespace && (
                           <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full uppercase">
                             <Hash className="w-3 h-3" />
                             {namespace}
                           </span>
                         )}
                      </div>
                    </div>
                    
                    {match.metadata && Object.keys(match.metadata).length > 0 && (
                      <div className="bg-muted/30 rounded-2xl p-4 border border-border/50">
                         <div className="flex items-center gap-2 mb-3 opacity-50">
                            <Database className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Metadata</span>
                         </div>
                         <pre className="text-xs font-mono text-muted-foreground overflow-auto max-h-48 scrollbar-hide">
                           {JSON.stringify(match.metadata, null, 2)}
                         </pre>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(match.id)}
                  className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upsert Modal */}
      {showUpsertModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
           <div className="bg-card border border-border rounded-[40px] shadow-2xl p-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-3 bg-primary text-primary-foreground rounded-2xl">
                    <Plus className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black tracking-tight">Upsert Vector</h3>
                    <p className="text-muted-foreground">Add or update a vector in this index</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-bold ml-1">Vector ID</label>
                       <input
                         type="text"
                         value={upsertData.id}
                         onChange={(e) => setUpsertData({...upsertData, id: e.target.value})}
                         placeholder="id-123"
                         className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold ml-1">Namespace (Optional)</label>
                       <input
                         type="text"
                         value={upsertData.namespace}
                         onChange={(e) => setUpsertData({...upsertData, namespace: e.target.value})}
                         placeholder="e.g. staging"
                         className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Vector Values (Comma separated)</label>
                    <textarea
                      value={upsertData.values}
                      onChange={(e) => setUpsertData({...upsertData, values: e.target.value})}
                      placeholder="0.12, -0.45, 0.89..."
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                      rows={4}
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Metadata (JSON string)</label>
                    <textarea
                      value={upsertData.metadata}
                      onChange={(e) => setUpsertData({...upsertData, metadata: e.target.value})}
                      placeholder='{"key": "value"}'
                      className="w-full px-4 py-3 bg-muted/30 border border-border rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono text-sm"
                      rows={3}
                    />
                 </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                 <button
                   onClick={() => setShowUpsertModal(false)}
                   className="px-6 py-3 font-bold text-muted-foreground hover:bg-muted rounded-2xl transition-all"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleUpsert}
                   disabled={upserting || !upsertData.id || !upsertData.values}
                   className="flex items-center gap-2 px-10 py-3 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
                 >
                   {upserting && <Loader2 className="w-4 h-4 animate-spin" />}
                   Upsert Vector
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
