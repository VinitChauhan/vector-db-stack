"use client";

import { useState, useEffect } from "react";
import { statsApi } from "@/lib/api";
import { 
  BarChart3, 
  Database, 
  FileText, 
  RefreshCw, 
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Stats {
  total_collections: number;
  total_documents: number;
  collections: Array<{
    name: string;
    count: number;
    metadata: Record<string, unknown> | null;
  }>;
  health: Record<string, unknown>;
}

interface Health {
  status: string;
  chromadb: Record<string, unknown>;
  timestamp: string;
}

export default function Stats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, healthRes] = await Promise.all([
        statsApi.get(),
        statsApi.health(),
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
    } catch (err) {
      setError("Failed to load statistics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Statistics</h2>
          <p className="text-muted-foreground">Database overview and health status</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Health Status */}
      <div className="mb-6 p-4 rounded-lg border border-border">
        <div className="flex items-center gap-3">
          {health?.status === "healthy" ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : (
            <XCircle className="w-6 h-6 text-destructive" />
          )}
          <div>
            <h3 className="font-medium">ChromaDB Status</h3>
            <p className="text-sm text-muted-foreground">
              {health?.status === "healthy" ? "Connected and operational" : "Connection issues detected"}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collections</p>
              <p className="text-2xl font-bold">{stats?.total_collections || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{stats?.total_documents || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Docs/Collection</p>
              <p className="text-2xl font-bold">
                {stats?.total_collections 
                  ? Math.round(stats.total_documents / stats.total_collections) 
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Details */}
      <div className="rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium">Collection Details</h3>
        </div>
        {stats?.collections && stats.collections.length > 0 ? (
          <div className="divide-y divide-border">
            {stats.collections.map((coll) => (
              <div key={coll.name} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{coll.name}</p>
                  {coll.metadata && Object.keys(coll.metadata).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(coll.metadata).length} metadata keys
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium">{coll.count}</p>
                  <p className="text-sm text-muted-foreground">documents</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No collections found</p>
          </div>
        )}
      </div>
    </div>
  );
}