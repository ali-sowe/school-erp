import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { search, status } — passed straight through to GET /guardians.
export function useGuardians(params = {}) {
  return useQuery({
    queryKey: ['guardians', params],
    queryFn: async () => {
      const response = await api.get('/guardians', { params });
      return response.data?.data ?? [];
    },
  });
}

// There's no GET /guardians/:id on the backend (see guardian.routes.js —
// only list and /:id/students exist), so the detail page fetches the full
// unfiltered list (same one the list page's default view uses, and shares
// its query cache) and finds the matching row client-side. Fine at this
// data volume — same reasoning as the list page having no server-side
// pagination.
export function useGuardian(guardianId) {
  const { data: guardians, ...rest } = useGuardians({});
  const guardian = guardians?.find((item) => String(item.id) === String(guardianId));
  return { data: guardian, ...rest };
}
