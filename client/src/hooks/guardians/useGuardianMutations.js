import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Every mutation invalidates ['guardians'] (prefix-matches every params
// variant of the list query, since useGuardian derives from that same
// cache — see useGuardians.js).
function useGuardianMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardians'] });
    },
  });
}

export function useCreateGuardian() {
  return useGuardianMutation(async (payload) => {
    const response = await api.post('/guardians', payload);
    return response.data?.data;
  });
}

export function useUpdateGuardian(guardianId) {
  return useGuardianMutation(async (payload) => {
    const response = await api.patch(`/guardians/${guardianId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveGuardian() {
  return useGuardianMutation(async (guardianId) => {
    const response = await api.patch(`/guardians/${guardianId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreGuardian() {
  return useGuardianMutation(async (guardianId) => {
    const response = await api.patch(`/guardians/${guardianId}/restore`);
    return response.data?.data;
  });
}

// Grants this guardian a Parent Portal login (see
// guardian-portal-account.service.js on the backend). email is optional —
// the backend falls back to the guardian's own email on file if omitted.
export function useCreateGuardianPortalAccount(guardianId) {
  return useGuardianMutation(async (payload) => {
    const response = await api.post(`/guardians/${guardianId}/portal-account`, payload);
    return response.data?.data;
  });
}
