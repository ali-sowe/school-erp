import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// One subject's results for this exam — null subjectId is a valid state
// (nothing chosen yet) rather than "fetch everything", since recording is
// always scoped to one subject at a time (recordResultsSchema requires it).
export function useExamResultsForSubject(examId, subjectId) {
  return useQuery({
    queryKey: ['exams', examId, 'results', subjectId],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}/results`, { params: { subject_id: subjectId } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(examId && subjectId),
  });
}

export function useRecordExamResults(examId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, entries }) => {
      const response = await api.post(`/exams/${examId}/results`, { subject_id: subjectId, entries });
      return response.data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'results', variables.subjectId] });
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'summary'] });
    },
  });
}

// Corrects one already-recorded result by its own id — a top-level
// endpoint (not exam-scoped), per exam-result.routes.js, mirroring
// attendance's single-record-correction pattern.
export function useUpdateExamResult(examId, subjectId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resultId, ...payload }) => {
      const response = await api.patch(`/exam-results/${resultId}`, payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'results', subjectId] });
      queryClient.invalidateQueries({ queryKey: ['exams', examId, 'summary'] });
    },
  });
}

export function useExamSummary(examId) {
  return useQuery({
    queryKey: ['exams', examId, 'summary'],
    queryFn: async () => {
      const response = await api.get(`/exams/${examId}/summary`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(examId),
  });
}
