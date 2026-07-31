import { registerReportDataset } from "../report-dataset-registry.js";
import * as invoiceRepository from "../../../repositories/finance/invoice.repository.js";

registerReportDataset('invoices', {
    label: 'Invoices',
    permissions: ['finance.read'],
    columns: [
        { key: 'id', label: 'Invoice #', width: 12 },
        { key: 'student_id', label: 'Student ID', width: 12 },
        { key: 'description', label: 'Description', width: 30 },
        { key: 'amount_due', label: 'Amount Due', width: 14 },
        { key: 'amount_paid', label: 'Amount Paid', width: 14 },
        { key: 'status', label: 'Status', width: 14 },
        { key: 'due_date', label: 'Due Date', width: 16 }
    ],
    fetch: async (schoolId, filters) => {
        return await invoiceRepository.findAll(schoolId, {
            studentId: filters.student_id,
            academicYearId: filters.academic_year_id,
            status: filters.status
        });
    }
});
