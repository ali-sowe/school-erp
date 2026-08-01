import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Submitting an expense also creates its approval request in the same
// backend call (see expense.service.js's submitExpense) — nothing further
// to wire up here; the resulting expense already carries the joined
// approval status.
export function useSubmitExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post('/expenses', payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
