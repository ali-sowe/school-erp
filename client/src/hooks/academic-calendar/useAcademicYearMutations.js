import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Reuses the ['academic-years'] query key from hooks/shared/useAcademicYears.js
// so every mutation here invalidates the same cache every selector across
// the app (ClassSelector, ExamForm's term-scoping, ...) reads from.
function useAcademicYearMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] });
    },
  });
}

export function useCreateAcademicYear() {
  return useAcademicYearMutation(async (payload) => {
    const response = await api.post('/academic-years', payload);
    return response.data?.data;
  });
}

export function useUpdateAcademicYear(academicYearId) {
  return useAcademicYearMutation(async (payload) => {
    const response = await api.patch(`/academic-years/${academicYearId}`, payload);
    return response.data?.data;
  });
}

export function useActivateAcademicYear() {
  return useAcademicYearMutation(async (academicYearId) => {
    const response = await api.patch(`/academic-years/${academicYearId}/activate`);
    return response.data?.data;
  });
}

export function useCompleteAcademicYear() {
  return useAcademicYearMutation(async (academicYearId) => {
    const response = await api.patch(`/academic-years/${academicYearId}/complete`);
    return response.data?.data;
  });
}

// The direct correction path (academic-year.service.js#overrideAcademicYear)
// — always audited, reachable by whoever holds academic-years.write. A
// second path exists server-side to route the same change through an
// Approval Workflow instead (requestAcademicYearOverride), but that only
// resolves for schools with more than one Administrator to approve it —
// exposing just the direct path here keeps this usable for the common
// single-administrator school (see Frontend UX Principles doc) without
// hiding the fact that every use is still logged.
export function useOverrideAcademicYear(academicYearId) {
  return useAcademicYearMutation(async (payload) => {
    const response = await api.patch(`/academic-years/${academicYearId}/override`, payload);
    return response.data?.data;
  });
}
