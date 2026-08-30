import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Every call here hits /portal/student/*, never the staff endpoints
// (/students, /attendance, etc.) — a Student Portal login holds only
// portal.student.read (see permission.helper.js), so those would 403.
// Identity is resolved server-side from the session; nothing here ever
// sends a student id.

export function useMyStudentProfile() {
  return useQuery({
    queryKey: ['portal', 'student', 'me'],
    queryFn: async () => {
      const response = await api.get('/portal/student/me');
      return response.data?.data;
    },
  });
}

export function useMyAttendance(params = {}) {
  return useQuery({
    queryKey: ['portal', 'student', 'attendance', params],
    queryFn: async () => {
      const response = await api.get('/portal/student/attendance', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useMyExamResults(params = {}) {
  return useQuery({
    queryKey: ['portal', 'student', 'exam-results', params],
    queryFn: async () => {
      const response = await api.get('/portal/student/exam-results', {
        params: { academic_year_id: params.academicYearId, term_id: params.termId },
      });
      return response.data?.data ?? [];
    },
  });
}

export function useMyLibraryBorrows(params = {}) {
  return useQuery({
    queryKey: ['portal', 'student', 'library', params],
    queryFn: async () => {
      const response = await api.get('/portal/student/library', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useMyStudentAnnouncements() {
  return useQuery({
    queryKey: ['portal', 'student', 'announcements'],
    queryFn: async () => {
      const response = await api.get('/portal/student/announcements');
      return response.data?.data ?? [];
    },
  });
}

export function useMarkMyAnnouncementRead(announcementId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.patch(`/portal/student/announcements/${announcementId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'student', 'announcements'] });
    },
  });
}
