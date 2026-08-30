import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useExamSubjects(examId) {
  return useQuery({
    queryKey: ['exams', examId, 'subjects'],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}/subjects`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(examId),
  });
}

export function useAddExamSubject(examId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, maxScore }) => {
      const response = await api.post(`/exams/${examId}/subjects`, { subject_id: subjectId, max_score: maxScore });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'subjects'] });
    },
  });
}

export function useRemoveExamSubject(examId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subjectId) => {
      const response = await api.delete(`/exams/${examId}/subjects/${subjectId}`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'subjects'] });
    },
  });
}
