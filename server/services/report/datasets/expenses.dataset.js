import { registerReportDataset } from "../report-dataset-registry.js";
import * as expenseRepository from "../../../repositories/expense/expense.repository.js";

registerReportDataset('expenses', {
    label: 'Expenses',
    permissions: ['expenses.read'],
    columns: [
        { key: 'id', label: 'Expense #', width: 12 },
        { key: 'title', label: 'Title', width: 30 },
        { key: 'category_id', label: 'Category ID', width: 12 },
        { key: 'amount', label: 'Amount', width: 14 },
        { key: 'expense_date', label: 'Expense Date', width: 16 },
        { key: 'vendor_name', label: 'Vendor', width: 24 },
        { key: 'status', label: 'Status', width: 18 }
    ],
    fetch: async (schoolId, filters) => {
        return await expenseRepository.findAll(schoolId, {
            categoryId: filters.category_id,
            academicYearId: filters.academic_year_id,
            status: filters.status
        });
    }
});
