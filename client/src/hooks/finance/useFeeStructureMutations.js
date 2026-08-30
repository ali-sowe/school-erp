import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useFeeStructureMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
    },
  });
}

export function useCreateFeeStructure() {
  return useFeeStructureMutation(async (payload) => {
    const response = await api.post('/fee-structures', payload);
    return response.data?.data;
  });
}

export function useUpdateFeeStructure(feeStructureId) {
  return useFeeStructureMutation(async (payload) => {
    const response = await api.patch(`/fee-structures/${feeStructureId}`, payload);
    return response.data?.data;
  });
}

export function useArchiveFeeStructure() {
  return useFeeStructureMutation(async (feeStructureId) => {
    const response = await api.patch(`/fee-structures/${feeStructureId}/archive`);
    return response.data?.data;
  });
}

export function useRestoreFeeStructure() {
  return useFeeStructureMutation(async (feeStructureId) => {
    const response = await api.patch(`/fee-structures/${feeStructureId}/restore`);
    return response.data?.data;
  });
}
