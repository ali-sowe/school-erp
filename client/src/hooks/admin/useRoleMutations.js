import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useRoleMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useCreateRole() {
  return useRoleMutation(async (payload) => {
    const response = await api.post('/roles', payload);
    return response.data?.data;
  });
}

export function useUpdateRole(roleId) {
  return useRoleMutation(async (payload) => {
    const response = await api.patch(`/roles/${roleId}`, payload);
    return response.data?.data;
  });
}

// Server-side guarded: fails with a clear message if this role is still
// assigned to any user (see role.service.js's deleteRole).
export function useDeleteRole() {
  return useRoleMutation(async (roleId) => {
    const response = await api.delete(`/roles/${roleId}`);
    return response.data?.data;
  });
}
