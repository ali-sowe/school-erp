import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function useStudentEnrollments(studentId) {
  return useQuery({
    queryKey: ['students', studentId, 'enrollments'],
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/enrollments`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(studentId),
  });
}

function useEnrollmentMutation(studentId, mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', studentId, 'enrollments'] });
    },
  });
}

export function useEnrollStudent(studentId) {
  return useEnrollmentMutation(studentId, async (payload) => {
    const response = await api.post(`/students/${studentId}/enrollments`, payload);
    return response.data?.data;
  });
}

export function useTransferStudent(studentId) {
  return useEnrollmentMutation(studentId, async ({ enrollmentId, classId }) => {
    const response = await api.patch(`/students/${studentId}/enrollments/${enrollmentId}/transfer`, { class_id: classId });
    return response.data?.data;
  });
}

export function useWithdrawStudent(studentId) {
  return useEnrollmentMutation(studentId, async ({ enrollmentId, reason }) => {
    const response = await api.patch(`/students/${studentId}/enrollments/${enrollmentId}/withdraw`, { reason });
    return response.data?.data;
  });
}

export function useCompleteEnrollment(studentId) {
  return useEnrollmentMutation(studentId, async ({ enrollmentId }) => {
    const response = await api.patch(`/students/${studentId}/enrollments/${enrollmentId}/complete`);
    return response.data?.data;
  });
}
