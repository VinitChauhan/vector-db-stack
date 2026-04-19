"use client";

import { useState, useEffect } from "react";
import { documentsApi } from "@/lib/api";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileText,
  Loader2,
  Upload,
  Files
} from "lucide-react";

interface DocumentsProps {
  collectionName: string | null;
  onBack: () => void;
}

interface Document {
  id: string;
  metadata: Record<string, unknown> | null;
  document: string | null;
}

type AddMode = "manual" | "upload";

export default function Documents({ collectionName, onBack }: DocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  
  // Add document form
  const [addMode, setAddMode] = useState<AddMode>("manual");
  const [newDocs, setNewDocs] = useState("");
  const [newMeta, setNewMeta] = useState("");
  const [autoEmbed, setAutoEmbed] = useState(true);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  
  // Delete mode
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const fetchDocuments = async () => {
    if (!collectionName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await documentsApi.list(collectionName, 100, 0);
      const docs = (res.data.ids || []).map((id: string, idx: number) => ({
        id,
        metadata: (res.data.metadatas || [])[idx] || null,
        document: (res.data.documents || [])[idx] || null,
      }));
      setDocuments(docs);
    } catch (err) {
      setError("Failed to load documents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [collectionName]);

  const parseMetadata = (): Record<string, unknown> | undefined => {
    const raw = newMeta.trim();
    if (!raw) return undefined;

    const parsed = JSON.parse(raw);
    if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Metadata must be a JSON object");
    }

    return Object.keys(parsed).length > 0 ? parsed : undefined;
  };

  const resetAddForm = () => {
    setShowAddModal(false);
    setAddMode("manual");
    setNewDocs("");
    setNewMeta("");
    setAutoEmbed(true);
    setUploadFiles([]);
  };

  const handleAddDocuments = async () => {
    if (!collectionName) return;
    setAdding(true);
    setError(null);
    try {
      const metadata = parseMetadata();

      if (addMode === "manual") {
        if (!newDocs.trim()) return;

        const lines = newDocs.split("\n").filter((l) => l.trim());
        const ids = lines.map((_, i) => `doc-${Date.now()}-${i}`);
        const docs = lines.map((l) => l.trim());
        const metadatas = metadata ? Array(lines.length).fill(metadata) : undefined;

        await documentsApi.add(collectionName, {
          ids,
          documents: docs,
          metadatas,
          auto_embed: autoEmbed,
        });
      } else {
        if (uploadFiles.length === 0) return;

        const formData = new FormData();
        uploadFiles.forEach((file) => formData.append("files", file));
        formData.append("auto_embed", String(autoEmbed));
        if (metadata) {
          formData.append("metadata_json", JSON.stringify(metadata));
        }

        await documentsApi.upload(collectionName, formData);
      }

      resetAddForm();
      fetchDocuments();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "Failed to add documents");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!collectionName || selectedIds.length === 0) return;
    try {
      await documentsApi.delete(collectionName, { ids: selectedIds });
      setSelectedIds([]);
      setDeleteMode(false);
      fetchDocuments();
    } catch (err) {
      setError("Failed to delete documents");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  if (!collectionName) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">Select a collection to view documents</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
        >
          Back to Collections
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{collectionName}</h2>
          <p className="text-muted-foreground">Documents in this collection</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDocuments}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {deleteMode ? (
            <>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedIds.length})
              </button>
              <button
                onClick={() => {
                  setDeleteMode(false);
                  setSelectedIds([]);
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setDeleteMode(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" />
                Add Documents
              </button>
            </>
          )}
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
      ) : documents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No documents in this collection</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
          >
            Add your first document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={`p-4 rounded-lg border border-border ${
                deleteMode && selectedIds.includes(doc.id)
                  ? "bg-destructive/10 border-destructive"
                  : "bg-card"
              }`}
            >
              {deleteMode && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(doc.id)}
                  onChange={() => toggleSelect(doc.id)}
                  className="mr-3"
                />
              )}
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-muted-foreground mb-1">
                    {doc.id}
                  </p>
                  {doc.document && (
                    <p className="text-sm whitespace-pre-wrap">{doc.document}</p>
                  )}
                  {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                      {JSON.stringify(doc.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Documents Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Add Documents</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setAddMode("manual")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    addMode === "manual"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Paste Text
                </button>
                <button
                  onClick={() => setAddMode("upload")}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    addMode === "upload"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </button>
              </div>

              {addMode === "manual" ? (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Documents (one per line)
                  </label>
                  <textarea
                    value={newDocs}
                    onChange={(e) => setNewDocs(e.target.value)}
                    placeholder="Document 1&#10;Document 2&#10;Document 3"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                    rows={6}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-sm font-medium">
                    Upload files from your computer
                  </label>
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
                    <input
                      type="file"
                      multiple
                      accept=".txt,.md,.csv,.json,.html,.htm,.pdf,.docx"
                      onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                      className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:text-primary-foreground hover:file:bg-primary/90"
                    />
                    <p className="mt-3 text-xs text-muted-foreground">
                      Supported: TXT, MD, CSV, JSON, HTML, PDF, DOCX. Larger files are split into chunks before indexing.
                    </p>
                  </div>

                  {uploadFiles.length > 0 && (
                    <div className="rounded-xl border border-border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Files className="w-4 h-4" />
                        {uploadFiles.length} file{uploadFiles.length === 1 ? "" : "s"} selected
                      </div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {uploadFiles.map((file) => (
                          <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3">
                            <span className="truncate">{file.name}</span>
                            <span className="whitespace-nowrap text-xs">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Metadata (JSON)
                </label>
                <textarea
                  value={newMeta}
                  onChange={(e) => setNewMeta(e.target.value)}
                  placeholder='Optional, e.g. {"team": "sales"}'
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background font-mono text-sm"
                  rows={2}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoEmbed}
                  onChange={(e) => setAutoEmbed(e.target.checked)}
                />
                <span className="text-sm">Auto-generate embeddings</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={resetAddForm}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocuments}
                disabled={adding || (addMode === "manual" ? !newDocs.trim() : uploadFiles.length === 0)}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                {addMode === "manual" ? "Add" : "Upload & Index"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
