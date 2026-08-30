import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// Staff-facing counterpart to the portal's useMyExamResults/
// useChildExamResults — same findForStudent repository query
// (exam_name/exam_type/subject_name all joined server-side), gated on
// exams.read here instead of a portal.*.read permission.
export function useStudentExamResults(studentId, params = {}) {
  return useQuery({
    queryKey: ['students', studentId, 'exam-results', params],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/exam-results`, {
        params: { academic_year_id: params.academicYearId, term_id: params.termId },
      });
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}
