import { registerReportDataset } from "../report-dataset-registry.js";
import * as teacherRepository from "../../../repositories/teacher/teacher.repository.js";

registerReportDataset('teachers', {
    label: 'Teachers',
    permissions: ['teachers.read'],
    columns: [
        { key: 'employee_number', label: 'Employee #' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'email', label: 'Email', width: 28 },
        { key: 'qualification', label: 'Qualification', width: 24 },
        { key: 'hire_date', label: 'Hire Date', width: 16 },
        { key: 'status', label: 'Status', width: 14 }
    ],
    fetch: async (schoolId, filters) => {
        return await teacherRepository.findAll(schoolId, { search: filters.search, status: filters.status });
    }
});
