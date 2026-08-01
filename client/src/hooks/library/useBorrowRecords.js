import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// params: { studentId, bookId, status, overdueOnly } — passed through to
// GET /library/borrow-records. Note the backend's actual param name is
// `overdue` (see borrow.controller.js), not `overdue_only` — matching that
// exactly here since a mismatched name would silently no-op the filter.
export function useBorrowRecords(params = {}) {
  return useQuery({
    queryKey: ['library-borrow-records', params],
    queryFn: async () => {
      const response = await api.get('/library/borrow-records', {
        params: {
          student_id: params.studentId,
          book_id: params.bookId,
          status: params.status,
          overdue: params.overdueOnly ? 'true' : undefined,
        },
      });
      return response.data?.data ?? [];
    },
  });
}

function useBorrowMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-borrow-records'] });
      // Issuing/returning a copy changes its status, which shifts the
      // parent book's copy-count breakdown too.
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
    },
  });
}

export function useBorrowBook(bookId) {
  return useBorrowMutation(async (payload) => {
    const response = await api.post(`/library/books/${bookId}/borrow`, payload);
    return response.data?.data;
  });
}

export function useReturnBook() {
  return useBorrowMutation(async ({ borrowRecordId, ...payload }) => {
    const response = await api.patch(`/library/borrow-records/${borrowRecordId}/return`, payload);
    return response.data?.data;
  });
}
