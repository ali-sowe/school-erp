import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useGuardianStudents(guardianId) {
  return useQuery({
    queryKey: ['guardians', guardianId, 'students'],
    queryFn: async () => {
      const response = await api.get(`/guardians/${guardianId}/students`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(guardianId),
  });
}
