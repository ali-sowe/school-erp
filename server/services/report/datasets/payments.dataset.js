import { registerReportDataset } from "../report-dataset-registry.js";
import * as paymentRepository from "../../../repositories/finance/payment.repository.js";

registerReportDataset('payments', {
    label: 'Payments',
    permissions: ['finance.read'],
    columns: [
        { key: 'id', label: 'Payment #', width: 12 },
        { key: 'invoice_id', label: 'Invoice ID', width: 12 },
        { key: 'amount', label: 'Amount', width: 14 },
        { key: 'payment_method', label: 'Method', width: 16 },
        { key: 'payment_date', label: 'Payment Date', width: 16 },
        { key: 'reference_number', label: 'Reference #', width: 20 },
        { key: 'status', label: 'Status', width: 14 }
    ],
    fetch: async (schoolId, filters) => {
        return await paymentRepository.findAll(schoolId, {
            invoiceId: filters.invoice_id,
            status: filters.status,
            from: filters.from,
            to: filters.to
        });
    }
});
