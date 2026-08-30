import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

function useInvoiceMutation(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Prefix match invalidates both the list and every ['invoices', id] detail.
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

export function useCreateInvoice() {
  return useInvoiceMutation(async (payload) => {
    const response = await api.post('/invoices', payload);
    return response.data?.data;
  });
}

// Generates one invoice per active student in the class from a single fee
// structure, in one call — the term-start "everyone in Class 4B owes Term 1
// tuition" flow, vs. useCreateInvoice's one-student-at-a-time form.
export function useBulkGenerateInvoices() {
  return useInvoiceMutation(async ({ feeStructureId, classId }) => {
    const response = await api.post('/invoices/bulk-generate', {
      fee_structure_id: feeStructureId,
      class_id: classId,
    });
    return response.data?.data;
  });
}

export function useVoidInvoice(invoiceId) {
  return useInvoiceMutation(async (reason) => {
    const response = await api.patch(`/invoices/${invoiceId}/void`, { reason });
    return response.data?.data;
  });
}

// Routes the void through the Approval Workflow Engine instead of applying
// it immediately — same INVOICE_VOID workflow_type built alongside
// academic-year override-request (see invoice.service.js's requestInvoiceVoid).
export function useRequestInvoiceVoid(invoiceId) {
  return useInvoiceMutation(async (reason) => {
    const response = await api.post(`/invoices/${invoiceId}/void-request`, { reason });
    return response.data?.data;
  });
}
