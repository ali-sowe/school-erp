import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Reuses the ['terms', {...}] query key shape from hooks/shared/useTerms.js.
// Terms are always scoped by academic_year_id in that key, so a blanket
// invalidate on the 'terms' prefix (not a specific year) is what actually
// refreshes every TermSelector/list regardless of which year they're
// currently scoped to.
function useTermMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terms'] });
    },
  });
}

export function useCreateTerm() {
  return useTermMutation(async (payload) => {
    const response = await api.post('/terms', payload);
    return response.data?.data;
  });
}

export function useUpdateTerm(termId) {
  return useTermMutation(async (payload) => {
    const response = await api.patch(`/terms/${termId}`, payload);
    return response.data?.data;
  });
}

export function useActivateTerm() {
  return useTermMutation(async (termId) => {
    const response = await api.patch(`/terms/${termId}/activate`);
    return response.data?.data;
  });
}

export function useCompleteTerm() {
  return useTermMutation(async (termId) => {
    const response = await api.patch(`/terms/${termId}/complete`);
    return response.data?.data;
  });
}
