import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useSubmitLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/leave-requests', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });
}
