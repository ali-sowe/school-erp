import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Every mutation invalidates ['exams'] (the list, and — since TanStack
// Query key matching is prefix-based — every ['exams', id] detail query
// too), same convention as useTeacherMutations.js.
export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/exams', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useUpdateExam(examId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch(`/exams/${examId}`, payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

// Lifecycle: SCHEDULED -> ONGOING -> COMPLETED, with an audited reopen back
// to ONGOING — see exam.service.js. Each of these three shares the same
// shape (no body except reopen's reason) so they share one hook factory
// rather than three near-identical copies.
function useExamLifecycleAction(examId, action) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch(`/exams/${examId}/${action}`, payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useStartExam(examId) {
  return useExamLifecycleAction(examId, 'start');
}

export function useCompleteExam(examId) {
  return useExamLifecycleAction(examId, 'complete');
}

export function useReopenExam(examId) {
  return useExamLifecycleAction(examId, 'reopen');
}
