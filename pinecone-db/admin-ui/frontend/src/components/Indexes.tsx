// filepath: frontend/src/components/Indexes.tsx
"use client";

import { useState, useEffect } from "react";
import { indexesApi } from "@/lib/api";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  Database,
  ChevronRight,
  Loader2,
  Tag
} from "lucide-react";
import clsx from "clsx";

interface Index {
  name: string;
  dimension: number;
  metric: string;
  host: string;
  status: {
    ready: boolean;
    state: string;
  };
  vector_count: number;
}

interface IndexesProps {
  selectedIndex: string | null;
  onSelectIndex: (name: string | null) => void;
}

export default function Indexes({ selectedIndex, onSelectIndex }: IndexesProps) {
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIndexName, setNewIndexName] = useState("");
  const [newIndexDimension, setNewIndexDimension] = useState(1536);
  const [newIndexMetric, setNewIndexMetric] = useState("cosine");
  const [creating, setCreating] = useState(false);

  const fetchIndexes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await indexesApi.list();
      setIndexes(res.data.indexes);
    } catch (err) {
      setError("Failed to load indexes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndexes();
  }, []);

  const handleCreate = async () => {
    if (!newIndexName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await indexesApi.create({ 
        name: newIndexName.trim(),
        dimension: newIndexDimension,
        metric: newIndexMetric
      });
      setShowCreateModal(false);
      setNewIndexName("");
      fetchIndexes();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to create index");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete index "${name}"? This cannot be undone.`)) return;
    try {
      await indexesApi.delete(name);
      if (selectedIndex === name) {
        onSelectIndex(null);
      }
      fetchIndexes();
    } catch (err) {
      setError("Failed to delete index");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Indexes</h2>
          <p className="text-muted-foreground">Manage your Pinecone vector indexes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchIndexes}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 outline-none transition-all focus:ring-2 focus:ring-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 outline-none transition-all focus:ring-2 focus:ring-primary/40 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            New Index
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl text-sm animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground animate-pulse">Connecting to Pinecone...</p>
        </div>
      ) : indexes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border-2 border-dashed border-border rounded-3xl animate-in zoom-in-95">
          <Database className="w-16 h-16 mx-auto mb-6 opacity-20" />
          <h3 className="text-xl font-medium text-foreground mb-2">No complexes found</h3>
          <p className="max-w-xs mx-auto">Create your first index to start storing and searching vectors.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {indexes.map((idx) => (
            <div
              key={idx.name}
              className={clsx(
                "group relative overflow-hidden flex items-center justify-between p-5 rounded-2xl border transition-all duration-300",
                selectedIndex === idx.name
                  ? "border-primary bg-primary/[0.03] shadow-md"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <button
                onClick={() => onSelectIndex(idx.name)}
                className="flex-1 flex items-center gap-5 text-left outline-none"
              >
                <div className={clsx(
                  "p-3 rounded-xl transition-colors shrink-0",
                  selectedIndex === idx.name ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{idx.name}</h3>
                    {idx.status.ready ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full">
                        {idx.status.state}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      {idx.vector_count.toLocaleString()} vectors
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      {idx.dimension}d
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                      {idx.metric}
                    </span>
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(idx.name)}
                  className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                  title="Delete Index"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onSelectIndex(idx.name)}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm",
                    selectedIndex === idx.name
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted text-foreground hover:bg-secondary"
                  )}
                >
                  {selectedIndex === idx.name ? 'Active' : 'Open'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 w-full max-w-lg animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Create New Index</h3>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1">Index Name</label>
                <input
                  type="text"
                  value={newIndexName}
                  onChange={(e) => setNewIndexName(e.target.value)}
                  placeholder="e.g. documentation-v2"
                  className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1">Dimension</label>
                  <input
                    type="number"
                    value={newIndexDimension}
                    onChange={(e) => setNewIndexDimension(parseInt(e.target.value))}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground ml-1">
                    768 for nomic-embed-text
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold ml-1">Distance Metric</label>
                  <select
                    value={newIndexMetric}
                    onChange={(e) => setNewIndexMetric(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="cosine">Cosine</option>
                    <option value="euclidean">Euclidean</option>
                    <option value="dotproduct">Dot Product</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-muted rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newIndexName.trim()}
                className="flex items-center gap-2 px-8 py-3 text-sm font-bold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Index
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
