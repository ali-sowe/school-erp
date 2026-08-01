import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useExpenseCategoryMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] });
    },
  });
}

export function useCreateExpenseCategory() {
  return useExpenseCategoryMutation(async (payload) => {
    const response = await api.post('/expense-categories', payload);
    return response.data?.data;
  });
}

export function useUpdateExpenseCategory(categoryId) {
  return useExpenseCategoryMutation(async (payload) => {
    const response = await api.patch(`/expense-categories/${categoryId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveExpenseCategory() {
  return useExpenseCategoryMutation(async (categoryId) => {
    const response = await api.patch(`/expense-categories/${categoryId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreExpenseCategory() {
  return useExpenseCategoryMutation(async (categoryId) => {
    const response = await api.patch(`/expense-categories/${categoryId}/restore`);
    return response.data?.data;
  });
}
