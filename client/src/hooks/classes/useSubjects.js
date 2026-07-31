import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useSubjects(params = {}) {
  return useQuery({
    queryKey: ['subjects', params],
    queryFn: async () => {
      const response = await api.get('/subjects', { params });
      return response.data?.data ?? [];
    },
  });
}

function useSubjectMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useCreateSubject() {
  return useSubjectMutation(async (payload) => {
    const response = await api.post('/subjects', payload);
    return response.data?.data;
  });
}

export function useUpdateSubject(subjectId) {
  return useSubjectMutation(async (payload) => {
    const response = await api.patch(`/subjects/${subjectId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveSubject() {
  return useSubjectMutation(async (subjectId) => {
    const response = await api.patch(`/subjects/${subjectId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreSubject() {
  return useSubjectMutation(async (subjectId) => {
    const response = await api.patch(`/subjects/${subjectId}/restore`);
    return response.data?.data;
  });
}
