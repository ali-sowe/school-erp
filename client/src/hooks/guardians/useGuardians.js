import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { search, status } — passed straight through to GET /guardians.
export function useGuardians(params = {}) {
  return useQuery({
    queryKey: ['guardians', params],
    queryFn: async () => {
      const response = await api.get('/guardians', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useGuardian(guardianId) {
  return useQuery({
    queryKey: ['guardians', guardianId],
    queryFn: async () => {
      const response = await api.get(`/guardians/${guardianId}`);
      return response.data?.data;
    },
    enabled: Boolean(guardianId),
  });
}
