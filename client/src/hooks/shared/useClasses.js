import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// No dedicated Classes module page exists on the frontend yet — this hook
// exists so ClassSelector (and anything else needing "pick a class") has
// one shared source instead of each caller re-implementing the fetch.
// When the Classes module is built, its list page should reuse this same
// hook rather than duplicating it.
export function useClasses(params = {}) {
  return useQuery({
    queryKey: ['classes', params],
    queryFn: async () => {
      const response = await api.get('/classes', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useClass(classId) {
  return useQuery({
    queryKey: ['classes', classId],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}`);
      return response.data?.data;
    },
    enabled: Boolean(classId),
  });
}
