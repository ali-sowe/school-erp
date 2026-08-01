import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useStudentBorrowHistory(studentId, { from, to } = {}) {
  return useQuery({
    queryKey: ['students', studentId, 'borrowed-books', { from, to }],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/borrowed-books`, { params: { from, to } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}
