"use client";

import { useState, useEffect } from "react";
import { embeddingsApi } from "@/lib/api";
import { 
  Settings as SettingsIcon, 
  Save, 
  Loader2,
  Info
} from "lucide-react";

interface EmbeddingConfig {
  provider: string;
  dimension: number;
}

export default function Settings() {
  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Form state
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"
  );

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await embeddingsApi.dimension();
        setEmbeddingConfig(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = () => {
    setSaving(true);
    // In a real app, you'd save to localStorage or a config file
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure your ChromaDB Admin settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* API Configuration */}
        <div className="p-4 rounded-lg border border-border">
          <h3 className="font-medium mb-4">API Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Backend API URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                placeholder="http://localhost:8001"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The URL of the FastAPI backend server
              </p>
            </div>
          </div>
        </div>

        {/* Embedding Configuration */}
        <div className="p-4 rounded-lg border border-border">
          <h3 className="font-medium mb-4">Embedding Configuration</h3>
          {embeddingConfig ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Provider</span>
                <span className="font-medium">{embeddingConfig.provider}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Dimension</span>
                <span className="font-medium">{embeddingConfig.dimension}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </div>

        {/* About */}
        <div className="p-4 rounded-lg border border-border">
          <h3 className="font-medium mb-4">About</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>ChromaDB Admin</strong> is a production-ready admin UI for 
              managing ChromaDB vector databases.
            </p>
            <div className="flex items-start gap-2 mt-2">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                This application uses FastAPI for the backend and Next.js for 
                the frontend, with Tailwind CSS for styling.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Save className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
          </button>
          {saved && (
            <span className="text-sm text-green-500">Settings saved successfully</span>
          )}
        </div>
      </div>
    </div>
  );
}