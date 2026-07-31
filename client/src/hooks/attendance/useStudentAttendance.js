import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useStudentAttendanceHistory(studentId, { from, to } = {}) {
  return useQuery({
    queryKey: ['students', studentId, 'attendance', { from, to }],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/attendance`, { params: { from, to } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

// PATCH /api/attendance/:id — for correcting a single already-recorded
// entry after the fact. Distinct from marking a whole day's roster (POST
// /classes/:id/attendance), which is always the bulk path — see
// attendance.routes.js's own comment on why this one lives separately.
export function useUpdateAttendanceRecord(studentId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recordId, ...payload }) => {
      const response = await api.patch(`/attendance/${recordId}`, payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'attendance'] });
    },
  });
}
