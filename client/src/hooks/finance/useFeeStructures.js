import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useFeeStructures(params = {}) {
  return useQuery({
    queryKey: ['fee-structures', params],
    queryFn: async () => {
      const response = await api.get('/fee-structures', { params });
      return response.data?.data ?? [];
    },
  });
}
