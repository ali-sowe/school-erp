import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// The plain enrollment roster (no attendance/exam data joined in) — used
// wherever a feature needs "which students are in this class" as its own
// building block, e.g. the exam results gradebook merges this with
// exam-results itself client-side, the way attendance's own roster+records
// endpoint does server-side.
export function useClassRoster(classId, { academicYearId, status = 'ACTIVE' } = {}) {
  return useQuery({
    queryKey: ['classes', classId, 'roster', academicYearId ?? 'active', status],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}/roster`, {
        params: { academic_year_id: academicYearId || undefined, status },
      });
      return response.data?.data ?? [];
    },
    enabled: Boolean(classId),
  });
}
