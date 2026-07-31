import { registerReportDataset } from "../report-dataset-registry.js";
import * as attendanceRepository from "../../../repositories/attendance/attendance.repository.js";

registerReportDataset('attendance', {
    label: 'Attendance',
    permissions: ['attendance.read'],
    columns: [
        { key: 'id', label: 'Record #', width: 12 },
        { key: 'student_id', label: 'Student ID', width: 12 },
        { key: 'class_id', label: 'Class ID', width: 12 },
        { key: 'attendance_date', label: 'Date', width: 16 },
        { key: 'status', label: 'Status', width: 14 },
        { key: 'remarks', label: 'Remarks', width: 24 }
    ],
    fetch: async (schoolId, filters) => {
        return await attendanceRepository.findAll(schoolId, {
            classId: filters.class_id,
            studentId: filters.student_id,
            from: filters.from,
            to: filters.to,
            status: filters.status
        });
    }
});
