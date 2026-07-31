import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useStudentGuardians(studentId) {
  return useQuery({
    queryKey: ['students', studentId, 'guardians'],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/guardians`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

// Guardian search is deliberately not a useQuery — it only runs on explicit
// form submission (search button), not as a background-fetched resource,
// so it's a plain async function the panel calls itself.
export async function searchGuardians(searchTerm) {
  const response = await api.get('/guardians', { params: { search: searchTerm, status: 'ACTIVE' } });
  return response.data?.data ?? [];
}

export function useLinkGuardian(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ guardianId, relationship, isPrimaryContact }) => {
      const response = await api.post(`/students/${studentId}/guardians`, {
        guardian_id: guardianId,
        relationship,
        is_primary_contact: isPrimaryContact,
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] });
    },
  });
}

export function useUnlinkGuardian(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (guardianId) => {
      await api.delete(`/students/${studentId}/guardians/${guardianId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'guardians'] });
    },
  });
}
