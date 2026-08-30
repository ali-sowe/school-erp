import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useSchools() {
  return useQuery({
    queryKey: ['schools'],
    queryFn: async () => {
      const response = await api.get('/schools');
      return response.data?.data ?? [];
    },
  });
}
