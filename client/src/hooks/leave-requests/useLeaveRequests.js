import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { user_id, status, leave_type } — passed straight through to
// GET /leave-requests (see leave-request.controller.js's getLeaveRequests).
export function useLeaveRequests(params = {}) {
  return useQuery({
    queryKey: ['leave-requests', params],
    queryFn: async () => {
      const response = await api.get('/leave-requests', { params });
      return response.data?.data ?? [];
    },
  });
}

// GET /leave-requests/my — scoped server-side to the current user rather
// than filtered client-side from the full list (see
// leave-request.controller.js's getMyLeaveRequests). Same leave-requests.read
// permission as the full list either way; this just saves a client-side
// filter and matches the "my pending" pattern used on the Approvals page.
export function useMyLeaveRequests(params = {}) {
  return useQuery({
    queryKey: ['leave-requests', 'my', params],
    queryFn: async () => {
      const response = await api.get('/leave-requests/my', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useLeaveRequest(leaveRequestId) {
  return useQuery({
    queryKey: ['leave-requests', leaveRequestId],
    queryFn: async () => {
      const response = await api.get(`/leave-requests/${leaveRequestId}`);
      return response.data?.data;
    },
    enabled: Boolean(leaveRequestId),
  });
}
