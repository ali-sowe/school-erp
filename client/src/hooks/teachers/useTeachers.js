import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { search, status } — passed straight through to GET /teachers
// (see teacher.controller.js's getTeachers).
export function useTeachers(params = {}) {
  return useQuery({
    queryKey: ['teachers', params],
    queryFn: async () => {
      const response = await api.get('/teachers', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useTeacher(teacherId) {
  return useQuery({
    queryKey: ['teachers', teacherId],
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}`);
      return response.data?.data;
    },
    enabled: Boolean(teacherId),
  });
}
