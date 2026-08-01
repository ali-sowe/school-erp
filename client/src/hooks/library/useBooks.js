import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useBooks(params = {}) {
  return useQuery({
    queryKey: ['library-books', params],
    queryFn: async () => {
      const response = await api.get('/library/books', { params });
      return response.data?.data ?? [];
    },
  });
}

// getBookById on the backend nests a `copies` count breakdown
// ({ AVAILABLE, BORROWED, LOST, DAMAGED, WITHDRAWN, TOTAL }) directly onto
// the book object — see book.service.js.
export function useBook(bookId) {
  return useQuery({
    queryKey: ['library-books', bookId],
    queryFn: async () => {
      const response = await api.get(`/library/books/${bookId}`);
      return response.data?.data;
    },
    enabled: Boolean(bookId),
  });
}

function useBookMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-books'] });
    },
  });
}

export function useCreateBook() {
  return useBookMutation(async (payload) => {
    const response = await api.post('/library/books', payload);
    return response.data?.data;
  });
}

export function useUpdateBook(bookId) {
  return useBookMutation(async (payload) => {
    const response = await api.patch(`/library/books/${bookId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveBook() {
  return useBookMutation(async (bookId) => {
    const response = await api.patch(`/library/books/${bookId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreBook() {
  return useBookMutation(async (bookId) => {
    const response = await api.patch(`/library/books/${bookId}/restore`);
    return response.data?.data;
  });
}
