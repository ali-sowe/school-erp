import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { class_id, academic_year_id, term_id, status } — passed
// straight through to GET /exams (see exam.controller.js's getExams).
export function useExams(params = {}) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: async () => {
      const response = await api.get('/exams', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useExam(examId) {
  return useQuery({
    queryKey: ['exams', examId],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}`);
      return response.data?.data;
    },
    enabled: Boolean(examId),
  });
}
