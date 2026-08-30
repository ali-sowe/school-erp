import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// params: { status, workflowType, entityType, entityId } — passed through
// to GET /approval-requests (see approval.controller.js's getApprovalRequests).
export function useApprovalRequests(params = {}) {
  return useQuery({
    queryKey: ['approval-requests', params],
    queryFn: async () => {
      const response = await api.get('/approval-requests', {
        params: {
          status: params.status,
          workflow_type: params.workflowType,
          entity_type: params.entityType,
          entity_id: params.entityId,
        },
      });
      return response.data?.data ?? [];
    },
  });
}

export function useApprovalRequest(id) {
  return useQuery({
    queryKey: ['approval-requests', id],
    queryFn: async () => {
      const response = await api.get(`/approval-requests/${id}`);
      return response.data?.data;
    },
    enabled: Boolean(id),
  });
}
