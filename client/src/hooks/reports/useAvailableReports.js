import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// Already filtered server-side to whatever datasets the current user's
// permissions actually allow (see report.service.js's getAvailableReports)
// — no client-side permission filtering needed on top of this.
export function useAvailableReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      const response = await api.get('/reports');
      return response.data?.data ?? [];
    },
  });
}
