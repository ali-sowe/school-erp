import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useUserMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useCreateUser() {
  return useUserMutation(async (payload) => {
    const response = await api.post('/users', payload);
    return response.data?.data;
  });
}

export function useUpdateUser(userId) {
  return useUserMutation(async (payload) => {
    const response = await api.patch(`/users/${userId}`, payload);
    return response.data?.data;
  });
}

// The backend genuinely hard-deletes users/roles (an older, Milestone-1-era
// design that predates the archive/restore convention every module since
// has used) — this is the real API contract, not a shortcut taken here.
// Self-delete and role-in-use are both guarded server-side; this hook just
// surfaces whatever error that produces via the caller's try/catch.
export function useDeleteUser() {
  return useUserMutation(async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data?.data;
  });
}
