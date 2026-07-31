import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useGradeLevels(params = {}) {
  return useQuery({
    queryKey: ['grade-levels', params],
    queryFn: async () => {
      const response = await api.get('/grade-levels', { params });
      return response.data?.data ?? [];
    },
  });
}

function useGradeLevelMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grade-levels'] });
    },
  });
}

export function useCreateGradeLevel() {
  return useGradeLevelMutation(async (payload) => {
    const response = await api.post('/grade-levels', payload);
    return response.data?.data;
  });
}

export function useUpdateGradeLevel(gradeLevelId) {
  return useGradeLevelMutation(async (payload) => {
    const response = await api.patch(`/grade-levels/${gradeLevelId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveGradeLevel() {
  return useGradeLevelMutation(async (gradeLevelId) => {
    const response = await api.patch(`/grade-levels/${gradeLevelId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreGradeLevel() {
  return useGradeLevelMutation(async (gradeLevelId) => {
    const response = await api.patch(`/grade-levels/${gradeLevelId}/restore`);
    return response.data?.data;
  });
}
