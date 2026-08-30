import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

// Registered import types (see importer-registry.js) — same
// registry/plugin pattern as the Approval Workflow Engine's executors and
// the Reports engine's datasets: this list grows as new domains register
// themselves, never by editing this hook.
export function useImportTargetTypes() {
  return useQuery({
    queryKey: ['data-imports', 'target-types'],
    queryFn: async () => {
      const response = await api.get('/data-imports/target-types');
      return response.data?.data ?? [];
    },
  });
}

export function useImportBatches(params = {}) {
  return useQuery({
    queryKey: ['data-imports', params],
    queryFn: async () => {
      const response = await api.get('/data-imports', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useImportBatch(batchId) {
  return useQuery({
    queryKey: ['data-imports', batchId],
    queryFn: async () => {
      const response = await api.get(`/data-imports/${batchId}`);
      return response.data?.data;
    },
    enabled: Boolean(batchId),
  });
}

export function useImportBatchRows(batchId, params = {}) {
  return useQuery({
    queryKey: ['data-imports', batchId, 'rows', params],
    queryFn: async () => {
      const response = await api.get(`/data-imports/${batchId}/rows`, { params });
      return response.data?.data ?? [];
    },
    enabled: Boolean(batchId),
  });
}
