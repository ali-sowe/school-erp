import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// The list query itself lives in hooks/shared/useClasses.js — that hook's
// own comment already calls for reusing it here rather than duplicating it,
// since ClassSelector and EnrollmentPanel depend on it too.
function useClassMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
    },
  });
}

export function useCreateClass() {
  return useClassMutation(async (payload) => {
    const response = await api.post('/classes', payload);
    return response.data?.data;
  });
}

export function useUpdateClass(classId) {
  return useClassMutation(async (payload) => {
    const response = await api.patch(`/classes/${classId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveClass() {
  return useClassMutation(async (classId) => {
    const response = await api.patch(`/classes/${classId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreClass() {
  return useClassMutation(async (classId) => {
    const response = await api.patch(`/classes/${classId}/restore`);
    return response.data?.data;
  });
}
