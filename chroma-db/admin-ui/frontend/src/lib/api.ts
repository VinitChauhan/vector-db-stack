// filepath: frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Collections API
export const collectionsApi = {
  list: () => api.get('/collections'),
  get: (name: string) => api.get(`/collections/${name}`),
  create: (data: { name: string; metadata?: Record<string, unknown>; get_or_create?: boolean }) => 
    api.post('/collections', data),
  delete: (name: string) => api.delete(`/collections/${name}`),
  peek: (name: string, limit?: number) => api.get(`/collections/${name}/peek`, { params: { limit } }),
};

// Documents API
export const documentsApi = {
  list: (collectionName: string, limit?: number, offset?: number) => 
    api.get(`/documents/${collectionName}`, { params: { limit, offset } }),
  add: (collectionName: string, data: {
    ids: string[];
    embeddings?: number[][];
    metadatas?: Record<string, unknown>[];
    documents?: string[];
    auto_embed?: boolean;
  }) => api.post(`/documents/${collectionName}`, data),
  query: (collectionName: string, data: {
    query_embeddings: number[][];
    n_results?: number;
    where?: Record<string, unknown>;
    where_document?: Record<string, unknown>;
    include_metadatas?: boolean;
    include_documents?: boolean;
    include_distances?: boolean;
    search_type?: 'semantic' | 'keyword' | 'hybrid';
    query_text?: string;
  }) => api.post(`/documents/${collectionName}/query`, data),
  chat: (collectionName: string, data: {
    query: string;
    n_results?: number;
    search_type?: 'semantic' | 'keyword' | 'hybrid';
    history?: { role: 'user' | 'assistant'; content: string }[];
  }) => api.post(`/documents/${collectionName}/chat`, data),
  delete: (collectionName: string, data: {
    ids?: string[];
    where?: Record<string, unknown>;
    where_document?: Record<string, unknown>;
  }) => api.delete(`/documents/${collectionName}`, { data }),
  upload: (collectionName: string, data: FormData) =>
    api.post(`/documents/${collectionName}/upload`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};

// Stats API
export const statsApi = {
  get: () => api.get('/stats'),
  health: () => api.get('/stats/health'),
};

// Embeddings API
export const embeddingsApi = {
  dimension: () => api.get('/embed-dimension'),
  embed: (texts: string[]) => api.post('/embed', texts),
};

export default api;
