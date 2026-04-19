# filepath: backend/app/services/hybrid_search_service.py
from typing import List, Dict, Any, Optional

class HybridSearchService:
    """Service to combine semantic and keyword search results"""

    def reciprocal_rank_fusion(
        self, 
        semantic_results: Dict[str, Any], 
        keyword_results: Dict[str, Any], 
        k: int = 60
    ) -> Dict[str, Any]:
        """
        Combine two sets of results using Reciprocal Rank Fusion.
        
        Args:
            semantic_results: Dictionary containing 'ids', 'metadatas', 'documents', 'distances'
            keyword_results: Dictionary containing 'ids', 'metadatas', 'documents'
            k: Constant for RRF formula (default 60)
            
        Returns:
            Dictionary in QueryResult format with fused results
        """
        scores: Dict[str, float] = {}
        info: Dict[str, Dict[str, Any]] = {}

        # Semantic results (usually list of lists, taking the first one)
        sem_ids = semantic_results.get("ids", [[]])[0]
        sem_metas = semantic_results.get("metadatas", [[]])[0]
        sem_docs = semantic_results.get("documents", [[]])[0]
        sem_dist = semantic_results.get("distances", [[]])[0]

        for i, doc_id in enumerate(sem_ids):
            scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + i + 1)
            if doc_id not in info:
                info[doc_id] = {
                    "metadata": sem_metas[i] if sem_metas else None,
                    "document": sem_docs[i] if sem_docs else None,
                    "distance": sem_dist[i] if sem_dist else None
                }

        # Keyword results (coll.get returns flat lists)
        key_ids = keyword_results.get("ids", [])
        key_metas = keyword_results.get("metadatas", [])
        key_docs = keyword_results.get("documents", [])

        for i, doc_id in enumerate(key_ids):
            scores[doc_id] = scores.get(doc_id, 0) + 1.0 / (k + i + 1)
            if doc_id not in info:
                info[doc_id] = {
                    "metadata": key_metas[i] if key_metas else None,
                    "document": key_docs[i] if key_docs else None,
                    "distance": None
                }

        # Sort by score descending
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

        return {
            "ids": [sorted_ids],
            "metadatas": [[info[doc_id]["metadata"] for doc_id in sorted_ids]],
            "documents": [[info[doc_id]["document"] for doc_id in sorted_ids]],
            "distances": [[info[doc_id]["distance"] for doc_id in sorted_ids]]
        }

hybrid_search_service = HybridSearchService()
