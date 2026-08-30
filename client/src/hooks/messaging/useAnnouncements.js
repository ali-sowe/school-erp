import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useRealtimeEvent } from '@/context/RealtimeContext';

export function useAnnouncements(params = {}) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      const response = await api.get('/announcements', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useAnnouncement(announcementId) {
  return useQuery({
    queryKey: ['announcements', announcementId],
    queryFn: async () => {
      const response = await api.get(`/announcements/${announcementId}`);
      return response.data?.data;
    },
    enabled: Boolean(announcementId),
  });
}

// Who has actually opened this announcement (vs. useAnnouncement's own
// content) — staff use this to see who still hasn't seen it.
export function useAnnouncementReaders(announcementId) {
  return useQuery({
    queryKey: ['announcements', announcementId, 'readers'],
    queryFn: async () => {
      const response = await api.get(`/announcements/${announcementId}/readers`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(announcementId),
  });
}

function useAnnouncementMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useCreateAnnouncement() {
  return useAnnouncementMutation(async (payload) => {
    const response = await api.post('/announcements', payload);
    return response.data?.data;
  });
}

// Editing title/body/audience after publish — same fields as create, just
// PATCH against the existing record instead of POST-ing a new one.
export function useUpdateAnnouncement(announcementId) {
  return useAnnouncementMutation(async (payload) => {
    const response = await api.patch(`/announcements/${announcementId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveAnnouncement() {
  return useAnnouncementMutation(async (announcementId) => {
    const response = await api.patch(`/announcements/${announcementId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreAnnouncement() {
  return useAnnouncementMutation(async (announcementId) => {
    const response = await api.patch(`/announcements/${announcementId}/restore`);
    return response.data?.data;
  });
}

export function useMarkAnnouncementRead(announcementId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.patch(`/announcements/${announcementId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

// The server pushes 'announcement:new' to the whole school room when one is
// published (see announcement.service.js) — refresh the list live rather
// than making people reload to see a just-published announcement.
export function useAnnouncementRealtimeSync() {
  const queryClient = useQueryClient();

  useRealtimeEvent('announcement:new', () => {
    queryClient.invalidateQueries({ queryKey: ['announcements'] });
  });
}
