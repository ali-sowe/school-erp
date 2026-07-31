import { QueryClient } from '@tanstack/react-query';

// Conservative defaults for a mostly-form-and-table admin app on
// sometimes-slow connections (Connectivity-Aware Frontend Strategy doc):
// don't refetch aggressively on every window focus, but do treat data as
// stale quickly enough that a second admin's changes show up soon after a
// manual action (create/update) invalidates the relevant query.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
