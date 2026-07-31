import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

export function usePaymentsForInvoice(invoiceId) {
  return useQuery({
    queryKey: ['invoices', invoiceId, 'payments'],
    queryFn: async () => {
      const response = await api.get(`/invoices/${invoiceId}/payments`);
      return response.data?.data ?? [];
    },
    enabled: Boolean(invoiceId),
  });
}

// Recording a payment changes the invoice's own amount_paid/status too (the
// backend recalculates it atomically — see payment.service.js), so this
// invalidates the invoice itself, not just the payments list under it.
export function useRecordPayment(invoiceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.post(`/invoices/${invoiceId}/payments`, payload);
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] });
    },
  });
}

export function useVoidPayment(invoiceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }) => {
      const response = await api.patch(`/payments/${paymentId}/void`, { reason });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] });
    },
  });
}

export function useRequestPaymentVoid(invoiceId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ paymentId, reason }) => {
      const response = await api.post(`/payments/${paymentId}/void-request`, { reason });
      return response.data?.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', invoiceId] });
    },
  });
}
