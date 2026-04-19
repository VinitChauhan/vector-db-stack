"use client";

import { useState, useEffect } from "react";
import { collectionsApi } from "@/lib/api";
import { 
  Plus, 
  Trash2, 
  RefreshCw, 
  FolderOpen,
  ChevronRight,
  Loader2
} from "lucide-react";
import clsx from "clsx";

interface Collection {
  name: string;
  metadata: Record<string, unknown> | null;
  count: number;
}

interface CollectionsProps {
  selectedCollection: string | null;
  onSelectCollection: (name: string | null) => void;
}

export default function Collections({ selectedCollection, onSelectCollection }: CollectionsProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionMeta, setNewCollectionMeta] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await collectionsApi.list();
      setCollections(res.data.collections);
    } catch (err) {
      setError("Failed to load collections");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const parseCollectionMetadata = (): Record<string, unknown> | undefined => {
    const raw = newCollectionMeta.trim();
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Metadata must be a JSON object");
    }

    return Object.keys(parsed).length > 0 ? parsed : undefined;
  };

  const handleCreate = async () => {
    if (!newCollectionName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const metadata = parseCollectionMetadata();
      await collectionsApi.create({ 
        name: newCollectionName.trim(),
        ...(metadata ? { metadata } : {}),
        get_or_create: false 
      });
      setShowCreateModal(false);
      setNewCollectionName("");
      setNewCollectionMeta("");
      fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete collection "${name}"? This cannot be undone.`)) return;
    try {
      await collectionsApi.delete(name);
      if (selectedCollection === name) {
        onSelectCollection(null);
      }
      fetchCollections();
    } catch (err) {
      setError("Failed to delete collection");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Collections</h2>
          <p className="text-muted-foreground">Manage your ChromaDB collections</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCollections}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : collections.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No collections found</p>
          <p className="text-sm">Create your first collection to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {collections.map((coll) => (
            <div
              key={coll.name}
              className={clsx(
                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                selectedCollection === coll.name
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              )}
            >
              <button
                onClick={() => onSelectCollection(coll.name)}
                className="flex-1 flex items-center gap-4 text-left"
              >
                <FolderOpen className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-medium">{coll.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {coll.count} documents
                    {coll.metadata && Object.keys(coll.metadata).length > 0 && (
                      <span className="ml-2">
                        • {Object.keys(coll.metadata).length} metadata keys
                      </span>
                    )}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectCollection(coll.name)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-md"
                >
                  View
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(coll.name)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Create Collection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="my-collection"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Metadata (JSON)
                </label>
                <textarea
                  value={newCollectionMeta}
                  onChange={(e) => setNewCollectionMeta(e.target.value)}
                  placeholder='Optional, e.g. {"source": "ui"}'
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newCollectionName.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
