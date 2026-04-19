"use client";

import { useState, useEffect, useRef } from "react";
import { collectionsApi, documentsApi, embeddingsApi } from "@/lib/api";
import { 
  Search as SearchIcon, 
  Loader2,
  FileText,
  Send,
  User,
  Bot,
  Info,
  Layers,
  Sparkles,
  Zap
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: any[];
  searchType?: string;
}

interface SearchProps {
  selectedCollection: string | null;
  onSelectCollection: (name: string | null) => void;
}

export default function DocumentChat({ selectedCollection, onSelectCollection }: SearchProps) {
  const [collections, setCollections] = useState<{ name: string }[]>([]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nResults, setNResults] = useState(5);
  const [searchType, setSearchType] = useState<"semantic" | "keyword" | "hybrid">("hybrid");
  const [embeddingDim, setEmbeddingDim] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [collRes, embRes] = await Promise.all([
          collectionsApi.list(),
          embeddingsApi.dimension(),
        ]);
        setCollections(collRes.data.collections);
        setEmbeddingDim(embRes.data.dimension);
      } catch (err) {
        console.error("Failed to initial data:", err);
      }
    };
    fetchData();
  }, []);

  const handleSendMessage = async () => {
    if (!selectedCollection || !input.trim() || searching) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setSearching(true);
    setError(null);

    try {
      const res = await documentsApi.chat(selectedCollection, {
        query: userMessage,
        n_results: nResults,
        search_type: searchType,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      });

      const { answer, sources } = res.data;
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: answer, 
        sources, 
        searchType 
      }]);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Chat request failed. Please try again.");
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "Sorry, I encountered an error while processing your request." 
      }]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Document Chat
          </h2>
          <p className="text-muted-foreground">
            Conversational RAG with {selectedCollection || "all documents"}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">Collection</label>
            <select
              value={selectedCollection || ""}
              onChange={(e) => {
                onSelectCollection(e.target.value || null);
                setMessages([]);
              }}
              className="px-3 py-1.5 border border-border rounded-lg bg-background text-sm min-w-[180px]"
            >
              <option value="">Select a collection</option>
              {collections.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-muted-foreground mb-1">Retrieval Mode</label>
            <div className="flex bg-muted p-1 rounded-lg gap-1">
              {(["semantic", "keyword", "hybrid"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSearchType(mode)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    searchType === mode 
                      ? "bg-background text-foreground shadow-sm font-medium" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-4 border border-border rounded-xl bg-muted/30 p-4 space-y-6 relative min-h-0 shadow-inner">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to {selectedCollection || "Document Chat"}</h3>
            <p className="text-muted-foreground max-w-sm">
              Ask questions about your uploaded documents. I'll use {searchType} search to find the most relevant context.
            </p>
            {!selectedCollection && (
              <div className="mt-4 p-3 bg-amber-500/10 text-amber-600 rounded-lg text-sm border border-amber-500/20">
                Please select a collection to start chatting.
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border border-border shadow-sm"
              }`}>
                {msg.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`flex flex-col gap-2 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-card border border-border rounded-tl-none text-foreground"
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>

                {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 w-full mb-1">
                      <Layers className="w-3 h-3" /> Sources ({msg.searchType})
                    </span>
                    {msg.sources.map((src, sIdx) => (
                      <div 
                        key={sIdx}
                        className="group relative flex items-center gap-2 px-2 py-1 bg-muted/50 border border-border rounded-md hover:bg-muted transition-colors cursor-help"
                        title={src.snippet}
                      >
                        <FileText className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium truncate max-w-[120px]">
                          {src.metadata?.source_file || src.id.substring(0, 8)}
                        </span>
                        
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-0 mb-2 invisible group-hover:visible z-50 p-3 bg-popover text-popover-foreground border border-border rounded-lg shadow-xl text-xs w-64">
                          <p className="font-semibold mb-1">Snippet:</p>
                          <p className="italic text-muted-foreground">{src.snippet}</p>
                          {src.metadata?.page && <p className="mt-2 text-primary">Page: {src.metadata.page}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 flex items-center gap-2">
            <Info className="w-4 h-4" />
            {error}
          </div>
        )}
        
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={selectedCollection ? "Ask a question about this collection..." : "Select a collection above..."}
            disabled={!selectedCollection || searching}
            className="w-full px-4 py-4 pr-14 border border-border rounded-2xl bg-background shadow-lg shadow-primary/5 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none min-h-[60px]"
            rows={2}
          />
          <button
            onClick={handleSendMessage}
            disabled={!selectedCollection || !input.trim() || searching}
            className="absolute right-3 bottom-3 p-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 shadow-md transform active:scale-95"
          >
            {searching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Zap className={`w-3.5 h-3.5 ${searchType === "hybrid" ? "text-amber-500 fill-amber-500" : ""}`} />
              Hybrid mode active
            </div>
            <div className="flex items-center gap-1.5 border-l border-border pl-3">
              <label>Top K:</label>
              <input 
                type="number" 
                value={nResults} 
                onChange={(e) => setNResults(parseInt(e.target.value) || 5)} 
                className="w-10 bg-transparent border-none outline-none font-medium text-foreground"
              />
            </div>
          </div>
          
          {embeddingDim && (
            <p className="text-[10px] text-muted-foreground font-mono">
              DIM: {embeddingDim}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}