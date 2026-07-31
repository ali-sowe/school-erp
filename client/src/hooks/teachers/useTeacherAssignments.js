import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// A teacher's own "my classes" view: every subject-assignment, across
// classes, optionally narrowed to one academic year. See
// teacher.routes.js's GET /teachers/:id/subject-assignments.
export function useTeacherSubjectAssignments(teacherId, academicYearId) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'subject-assignments', academicYearId ?? 'all'],
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/subject-assignments`, {
        params: { academic_year_id: academicYearId || undefined },
      });
      return response.data?.data ?? [];
    },
    enabled: Boolean(teacherId),
  });
}

// Every class this teacher has been (or is) the homeroom/form teacher for.
// See teacher.routes.js's GET /teachers/:id/class-teacher-assignments.
export function useTeacherClassTeacherAssignments(teacherId) {
  return useQuery({
    queryKey: ['teachers', teacherId, 'class-teacher-assignments'],
    queryFn: async () => {
      const response = await api.get(`/teachers/${teacherId}/class-teacher-assignments`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(teacherId),
  });
}
