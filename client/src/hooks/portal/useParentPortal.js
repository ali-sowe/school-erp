import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Same story as useStudentPortal.js: only /portal/parent/* — a Parent
// Portal login holds portal.parent.read and nothing else. Every
// child-scoped call takes studentId in the URL, but the backend still
// verifies that child is actually linked to this guardian on every single
// call (see parent-portal.service.js's ensureIsMyChild) — the id in the
// URL is never trusted alone.

export function useMyChildren() {
  return useQuery({
    queryKey: ['portal', 'parent', 'children'],
    queryFn: async () => {
      const response = await api.get('/portal/parent/children');
      return response.data?.data ?? [];
    },
  });
}

export function useChildAttendance(studentId, params = {}) {
  return useQuery({
    queryKey: ['portal', 'parent', 'children', studentId, 'attendance', params],
    queryFn: async () => {
      const response = await api.get(`/portal/parent/children/${studentId}/attendance`, { params });
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

export function useChildExamResults(studentId, params = {}) {
  return useQuery({
    queryKey: ['portal', 'parent', 'children', studentId, 'exam-results', params],
    queryFn: async () => {
      const response = await api.get(`/portal/parent/children/${studentId}/exam-results`, {
        params: { academic_year_id: params.academicYearId, term_id: params.termId },
      });
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

export function useChildInvoices(studentId) {
  return useQuery({
    queryKey: ['portal', 'parent', 'children', studentId, 'invoices'],
    queryFn: async () => {
      const response = await api.get(`/portal/parent/children/${studentId}/invoices`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

export function useChildLibraryBorrows(studentId, params = {}) {
  return useQuery({
    queryKey: ['portal', 'parent', 'children', studentId, 'library', params],
    queryFn: async () => {
      const response = await api.get(`/portal/parent/children/${studentId}/library`, { params });
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

export function useChildAnnouncements(studentId) {
  return useQuery({
    queryKey: ['portal', 'parent', 'children', studentId, 'announcements'],
    queryFn: async () => {
      const response = await api.get(`/portal/parent/children/${studentId}/announcements`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

export function useMarkChildAnnouncementRead(announcementId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.patch(`/portal/parent/announcements/${announcementId}/read`);
    },
    onSuccess: () => {
      // Broad invalidation (every child's announcement list) rather than
      // scoping to one studentId — cheap for the handful of children a
      // parent has, and avoids threading studentId through just for this.
      queryClient.invalidateQueries({ queryKey: ['portal', 'parent', 'children'] });
    },
  });
}
