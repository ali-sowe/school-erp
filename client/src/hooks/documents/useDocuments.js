import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useDocuments(params = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: async () => {
      const response = await api.get('/documents', { params });
      return response.data?.data ?? [];
    },
  });
}

// Full-text search over title/description/extracted_text (see the
// ft_documents_search FULLTEXT index) — only runs when q is non-empty, so
// callers don't need to guard the hook itself with `enabled`.
export function useSearchDocuments(q, params = {}) {
  return useQuery({
    queryKey: ['documents', 'search', q, params],
    queryFn: async () => {
      const response = await api.get('/documents/search', { params: { q, ...params } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(q?.trim()),
  });
}

export function useDocument(documentId) {
  return useQuery({
    queryKey: ['documents', documentId],
    queryFn: async () => {
      const response = await api.get(`/documents/${documentId}`);
      return response.data?.data;
    },
    enabled: Boolean(documentId),
  });
}
