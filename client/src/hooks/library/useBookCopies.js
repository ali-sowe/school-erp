import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useBookCopies(bookId, status) {
  return useQuery({
    queryKey: ['library-books', bookId, 'copies', status],
    queryFn: async () => {
      const response = await api.get(`/library/books/${bookId}/copies`, { params: { status } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(bookId),
  });
}

// Invalidates both the copies list AND the book detail (its nested copy
// counts need refreshing too) plus the plain book list (catalog rows may
// show an availability summary derived from these same counts).
function useCopyMutation(bookId, mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books', bookId] });
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
    },
  });
}

export function useAddCopies(bookId) {
  return useCopyMutation(bookId, async (payload) => {
    const response = await api.post(`/library/books/${bookId}/copies`, payload);
    return response.data?.data;
  });
}

export function useWithdrawCopy(bookId) {
  return useCopyMutation(bookId, async ({ copyId, reason }) => {
    const response = await api.patch(`/library/copies/${copyId}/withdraw`, { reason });
    return response.data?.data;
  });
}

export function useRestoreCopy(bookId) {
  return useCopyMutation(bookId, async (copyId) => {
    const response = await api.patch(`/library/copies/${copyId}/restore`);
    return response.data?.data;
  });
}
