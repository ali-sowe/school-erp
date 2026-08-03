import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useRealtimeEvent } from '@/context/RealtimeContext';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get('/notifications');
      return response.data?.data ?? [];
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data?.data?.count ?? 0;
    },
  });
}

function useNotificationMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkNotificationRead() {
  return useNotificationMutation(async (notificationId) => {
    await api.patch(`/notifications/${notificationId}/read`);
  });
}

export function useMarkAllNotificationsRead() {
  return useNotificationMutation(async () => {
    await api.patch('/notifications/read-all');
  });
}

// Every notification is user-scoped (see notification.routes.js's own
// comment: no id-scoped ownership param needed, it's always "my inbox"),
// pushed via emitToUser — so this refreshes both the list and the unread
// count the moment one arrives, no polling needed.
export function useNotificationRealtimeSync() {
  const queryClient = useQueryClient();

  useRealtimeEvent('notification:new', () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  });
}
