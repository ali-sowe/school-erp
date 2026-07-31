import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data?.data ?? [];
    },
  });
}
