import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// One query per distinct server resource, colocated near where it's used
// first (Dashboard) but exported so any other page needing the same data
// (e.g. a future dedicated Approvals page) reuses this instead of
// duplicating the fetch — TanStack Query also dedupes/caches by queryKey,
// so both call sites share one network request.
export function useMyPendingApprovals() {
  return useQuery({
    queryKey: ['approval-requests', 'my-pending'],
    queryFn: async () => {
      const response = await api.get('/approval-requests/my-pending');
      return response.data?.data ?? [];
    },
  });
}
