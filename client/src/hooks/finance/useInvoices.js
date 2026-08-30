import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useInvoices(params = {}) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: async () => {
      const response = await api.get('/invoices', { params });
      return response.data?.data ?? [];
    },
  });
}

export function useInvoice(invoiceId) {
  return useQuery({
    queryKey: ['invoices', invoiceId],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data?.data;
    },
    enabled: Boolean(invoiceId),
  });
}
