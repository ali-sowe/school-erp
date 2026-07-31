import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useClassSubjects(classId) {
  return useQuery({
    queryKey: ['classes', classId, 'subjects'],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}/subjects`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(classId),
  });
}

export function useAssignSubjectToClass(classId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subjectId) => {
      const response = await api.post(`/classes/${classId}/subjects`, { subject_id: subjectId });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'subjects'] });
    },
  });
}

export function useRemoveSubjectFromClass(classId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (subjectId) => {
      await api.delete(`/classes/${classId}/subjects/${subjectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'subjects'] });
    },
  });
}
