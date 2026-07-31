import { registerReportDataset } from "../report-dataset-registry.js";
import * as borrowRepository from "../../../repositories/library/borrow.repository.js";

registerReportDataset('library-borrow-records', {
    label: 'Library Borrow Records',
    permissions: ['library.read'],
    columns: [
        { key: 'id', label: 'Record #', width: 12 },
        { key: 'student_id', label: 'Student ID', width: 12 },
        { key: 'book_id', label: 'Book ID', width: 12 },
        { key: 'borrowed_date', label: 'Borrowed Date', width: 16 },
        { key: 'due_date', label: 'Due Date', width: 16 },
        { key: 'returned_date', label: 'Returned Date', width: 16 },
        { key: 'status', label: 'Status', width: 14 },
        { key: 'is_overdue', label: 'Overdue', width: 10 }
    ],
    fetch: async (schoolId, filters) => {
        return await borrowRepository.findAll(schoolId, {
            studentId: filters.student_id,
            bookId: filters.book_id,
            status: filters.status,
            overdueOnly: filters.overdue_only
        });
    }
});
