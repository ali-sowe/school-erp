import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useAcademicYears() {
  return useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await api.get('/academic-years');
      return response.data?.data ?? [];
    },
  });
}
