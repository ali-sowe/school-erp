import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useExpenseCategories(params = {}) {
  return useQuery({
    queryKey: ['expense-categories', params],
    queryFn: async () => {
      const response = await api.get('/expense-categories', { params });
      return response.data?.data ?? [];
    },
  });
}
