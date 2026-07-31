import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Every mutation invalidates ['teachers'] (the list, and — since TanStack
// Query key matching is prefix-based — every ['teachers', id] detail query
// too), same convention as useStudentMutations.js.
export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/teachers', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

export function useUpdateTeacher(teacherId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.patch(`/teachers/${teacherId}`, payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

export function useArchiveTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherId) => {
      const response = await api.patch(`/teachers/${teacherId}/archive`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}

export function useRestoreTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherId) => {
      const response = await api.patch(`/teachers/${teacherId}/restore`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });
}
