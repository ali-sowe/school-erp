import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

const DASHBOARD_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats');
      return data.data;
    },
    staleTime: DASHBOARD_STALE_TIME,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/activity');
      return data.data;
    },
    staleTime: DASHBOARD_STALE_TIME,
  });
}

export function useUpcomingEvents() {
  return useQuery({
    queryKey: ['dashboard', 'upcoming'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/upcoming');
      return data.data;
    },
    staleTime: DASHBOARD_STALE_TIME,
  });
}