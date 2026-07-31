import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Only ACTIVE classes can take attendance — the API rejects an archived
// class outright, so there's no point offering them elsewhere.
export function useClassAttendanceRoster(classId, date) {
  return useQuery({
    queryKey: ['classes', classId, 'attendance', date],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}/attendance`, { params: { date } });
      return response.data?.data ?? [];
    },
    enabled: Boolean(classId && date),
  });
}

export function useMarkAttendance(classId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, entries }) => {
      const response = await api.post(`/classes/${classId}/attendance`, { date, entries });
      return response.data?.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'attendance', variables.date] });
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'attendance', 'summary'] });
    },
  });
}

export function useClassAttendanceSummary(classId, { from, to } = {}) {
  return useQuery({
    queryKey: ['classes', classId, 'attendance', 'summary', { from, to }],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}/attendance/summary`, { params: { from, to } });
      return response.data?.data;
    },
    enabled: Boolean(classId),
  });
}
