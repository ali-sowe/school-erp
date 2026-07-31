import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// academicYearId narrows to one year's terms (see term.controller.js's
// getTerms) — omit it to get every term across every year.
export function useTerms(academicYearId) {
  return useQuery({
    queryKey: ['terms', academicYearId ?? 'all'],
    queryFn: async () => {
      const response = await api.get('/terms', { params: { academic_year_id: academicYearId || undefined } });
      return response.data?.data ?? [];
    },
  });
}
