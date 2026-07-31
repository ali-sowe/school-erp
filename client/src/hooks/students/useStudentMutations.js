import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Every mutation invalidates ['students'] (the list, and — since TanStack
// Query key matching is prefix-based — every ['students', id] detail query
// too) so the UI reflects the change without a manual refetch call at each
// call site.
export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/students', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useUpdateStudent(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch(`/students/${studentId}`, payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useArchiveStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId) => {
      const response = await api.patch(`/students/${studentId}/archive`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

export function useRestoreStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId) => {
      const response = await api.patch(`/students/${studentId}/restore`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
