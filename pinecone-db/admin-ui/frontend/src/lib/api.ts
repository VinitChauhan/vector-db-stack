// filepath: frontend/src/lib/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Indexes API
export const indexesApi = {
  list: () => api.get('/indexes'),
  get: (name: string) => api.get(`/indexes/${name}`),
  create: (data: { name: string; dimension: number; metric: string }) => 
    api.post('/indexes', data),
  delete: (name: string) => api.delete(`/indexes/${name}`),
};

// Vectors API
export const vectorsApi = {
  upsert: (indexName: string, data: {
    ids: string[];
    values: number[][];
    metadatas?: Record<string, unknown>[];
    namespace?: string;
  }) => api.post(`/vectors/${indexName}/upsert`, data),
  query: (indexName: string, data: {
    vector?: number[];
    query_text?: string;
    top_k?: number;
    namespace?: string;
    filter?: Record<string, unknown>;
    include_metadata?: boolean;
    include_values?: boolean;
  }) => api.post(`/vectors/${indexName}/query`, data),
  fetch: (indexName: string, vectorId: string, namespace?: string) =>
    api.get(`/vectors/${indexName}/${vectorId}`, { params: { namespace } }),
  delete: (indexName: string, data: {
    ids?: string[];
    delete_all?: boolean;
    namespace?: string;
    filter?: Record<string, unknown>;
  }) => api.delete(`/vectors/${indexName}`, { data }),
};

// Stats API
export const statsApi = {
  list: () => api.get('/stats'),
  get: (indexName: string) => api.get(`/stats/${indexName}`),
  health: () => api.get('/stats/health'),
};

// Embeddings API
export const embeddingsApi = {
  dimension: () => api.get('/embed-dimension'),
};

export default api;
