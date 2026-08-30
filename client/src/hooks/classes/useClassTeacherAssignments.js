import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Every subject this class is taught, with the assigned teacher joined in.
// See class.routes.js's GET /classes/:id/subject-teachers. No academic year
// picker in this first pass — the backend defaults to the active year when
// omitted, and that's the only year most schools need day-to-day.
export function useClassSubjectTeachers(classId) {
  return useQuery({
    queryKey: ['classes', classId, 'subject-teachers'],
    queryFn: async () => {
      const response = await api.get(`/classes/${classId}/subject-teachers`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(classId),
  });
}

export function useAssignSubjectTeacher(classId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ subjectId, teacherId }) => {
      const response = await api.post(`/classes/${classId}/subject-teachers`, {
        subject_id: subjectId,
        teacher_id: teacherId,
      });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'subject-teachers'] });
    },
  });
}

// Ends one already-recorded assignment by its own id — a top-level
// endpoint (not class-scoped), per teacher-subject-assignment.routes.js.
export function useEndSubjectTeacherAssignment(classId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId) => {
      const response = await api.patch(`/teacher-subject-assignments/${assignmentId}/end`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'subject-teachers'] });
    },
  });
}

// GET /classes/:id/class-teacher 404s when no homeroom teacher has been
// assigned yet for the active year (see class-teacher.service.js's
// getClassTeacher) — that's a normal, expected state here, not an error,
// so it's translated to `null` rather than left to surface as a query
// error the page would need to handle separately from "not assigned yet".
export function useClassTeacher(classId) {
  return useQuery({
    queryKey: ['classes', classId, 'class-teacher'],
    queryFn: async () => {
      try {
        const response = await api.get(`/classes/${classId}/class-teacher`);
        return response.data?.data ?? null;
      } catch (error) {
        if (error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: Boolean(classId),
  });
}

export function useAssignClassTeacher(classId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teacherId) => {
      const response = await api.put(`/classes/${classId}/class-teacher`, { teacher_id: teacherId });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'class-teacher'] });
    },
  });
}

// Ends the current homeroom assignment by its own id — a top-level
// endpoint, per class-teacher-assignment.routes.js.
export function useEndClassTeacherAssignment(classId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assignmentId) => {
      const response = await api.patch(`/class-teacher-assignments/${assignmentId}/end`);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes', classId, 'class-teacher'] });
    },
  });
}
