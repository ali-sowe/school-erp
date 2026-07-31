import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { search, status } — passed straight through to the backend's
// GET /students query params (see student.controller.js).
export function useStudents(params = {}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: async () => {
      const response = await api.get('/students', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useStudent(studentId) {
  return useQuery({
    queryKey: ['students', studentId],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}`);
      return response.data?.data;
    },
    enabled: Boolean(studentId),
  });
}
