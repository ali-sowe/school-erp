import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data?.data ?? [];
    },
  });
}
