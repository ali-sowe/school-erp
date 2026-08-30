import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useSchoolMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools'] });
    },
  });
}

// Creates the school and its first Administrator account in one call — see
// school.service.js's createSchool, which does both atomically server-side.
export function useCreateSchool() {
  return useSchoolMutation(async (payload) => {
    const response = await api.post('/schools', payload);
    return response.data?.data;
  });
}

export function useUpdateSchool(schoolId) {
  return useSchoolMutation(async (payload) => {
    const response = await api.patch(`/schools/${schoolId}`, payload);
    return response.data?.data;
  });
}

export function useSuspendSchool() {
  return useSchoolMutation(async (schoolId) => {
    const response = await api.patch(`/schools/${schoolId}/suspend`);
    return response.data?.data;
  });
}

export function useReactivateSchool() {
  return useSchoolMutation(async (schoolId) => {
    const response = await api.patch(`/schools/${schoolId}/reactivate`);
    return response.data?.data;
  });
}
