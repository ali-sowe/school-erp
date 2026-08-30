import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useImportBatchMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-imports'] });
    },
  });
}

// Validates every row up front against the document (see
// import-batch.service.js's own comment: "show the whole picture, before
// it happens") — the returned batch already has valid_rows/invalid_rows
// counts, no separate "validate" step to call afterward.
export function useCreateImportBatch() {
  return useImportBatchMutation(async ({ documentId, targetType, context }) => {
    const response = await api.post('/data-imports', {
      document_id: documentId,
      target_type: targetType,
      ...(context ? { context } : {}),
    });
    return response.data?.data;
  });
}

export function useConfirmImportBatch(batchId) {
  return useImportBatchMutation(async () => {
    const response = await api.patch(`/data-imports/${batchId}/confirm`);
    return response.data?.data;
  });
}

export function useCancelImportBatch(batchId) {
  return useImportBatchMutation(async () => {
    const response = await api.patch(`/data-imports/${batchId}/cancel`);
    return response.data?.data;
  });
}
