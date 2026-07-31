import { registerReportDataset } from "../report-dataset-registry.js";
import * as studentRepository from "../../../repositories/student/student.repository.js";

registerReportDataset('students', {
    label: 'Students',
    permissions: ['students.read'],
    columns: [
        { key: 'admission_number', label: 'Admission #' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'gender', label: 'Gender', width: 12 },
        { key: 'admission_date', label: 'Admission Date', width: 16 },
        { key: 'status', label: 'Status', width: 14 }
    ],
    fetch: async (schoolId, filters) => {
        return await studentRepository.findAll(schoolId, { search: filters.search, status: filters.status });
    }
});
