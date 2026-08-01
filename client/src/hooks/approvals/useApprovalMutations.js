import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// Every decision invalidates the whole ['approval-requests'] prefix — the
// list, the single-request detail, and 'my-pending' (used by the dashboard
// widget too) all key off that same prefix, so one invalidate call keeps
// every view in sync without each mutation needing to know which views
// happen to be mounted.
function useApprovalMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
    },
  });
}

export function useApproveStep(requestId) {
  return useApprovalMutation(async (comment) => {
    const response = await api.patch(`/approval-requests/${requestId}/approve`, { comment: comment || undefined });
    return response.data?.data;
  });
}

export function useRejectStep(requestId) {
  return useApprovalMutation(async (comment) => {
    const response = await api.patch(`/approval-requests/${requestId}/reject`, { comment });
    return response.data?.data;
  });
}

export function useExecuteRequest(requestId) {
  return useApprovalMutation(async (note) => {
    const response = await api.patch(`/approval-requests/${requestId}/execute`, { note: note || undefined });
    return response.data?.data;
  });
}

export function useCancelRequest(requestId) {
  return useApprovalMutation(async (reason) => {
    const response = await api.patch(`/approval-requests/${requestId}/cancel`, { reason });
    return response.data?.data;
  });
}
