import Joi from 'joi';
import { registerDataImporter } from '../importer-registry.js';
import { AppError } from '../../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../../constants/httpStatus.js';
import { ATTENDANCE_STATUSES, validateAttendanceDate } from '../../../helpers/attendance/attendance.helper.js';
import { findOwnedClassOrThrow, resolveAcademicYearId } from '../../../helpers/student/enrollment.helper.js';
import * as studentRepository from '../../../repositories/student/student.repository.js';
import * as attendanceService from '../../attendance/attendance.service.js';

const contextSchema = Joi.object({
    class_id: Joi.number().integer().positive().required(),
    date: Joi.date().iso().required(),
    academic_year_id: Joi.number().integer().positive(),
});

const rowSchema = Joi.object({
    admission_number: Joi.string().trim().max(50).required(),
    status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
    remarks: Joi.string().trim().max(255).allow('', null),
});

// A day's attendance sheet is one class, one date, many students — class
// and date belong to the batch (import_batches.context), not each row.
registerDataImporter('ATTENDANCE', {
    label: 'Attendance',
    expectedColumns: ['admission_number', 'status', 'remarks'],

    async resolveContext(context, schoolId) {
        const { error, value } = contextSchema.validate(context ?? {});
        if (error) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, `Import context is invalid: ${error.details.map((d) => d.message).join('; ')}`);
        }

        const classRecord = await findOwnedClassOrThrow(value.class_id, schoolId);
        if (classRecord.status === 'ARCHIVED') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Cannot import attendance for an archived class.');
        }

        const isoDate = value.date.toISOString().slice(0, 10);
        validateAttendanceDate(isoDate);
        const academicYearId = await resolveAcademicYearId(value.academic_year_id, schoolId);

        return { class_id: value.class_id, date: isoDate, academic_year_id: academicYearId };
    },

    async validateRow(rowData, schoolId) {
        const { error, value } = rowSchema.validate(rowData, { abortEarly: false, stripUnknown: true });
        if (error) {
            return { valid: false, errors: error.details.map((detail) => detail.message) };
        }

        const student = await studentRepository.findByAdmissionNumber(schoolId, value.admission_number);
        if (!student) {
            return { valid: false, errors: [`No student found with admission number "${value.admission_number}".`] };
        }

        return {
            valid: true,
            errors: [],
            normalized: { student_id: student.id, status: value.status, remarks: value.remarks ?? null },
        };
    },

    // markAttendance is written for a whole class's roster at once; called
    // here with a single-entry array so roster-membership and duplicate
    // checks stay real, same reasoning as the exam-marks importer.
    async importRow(normalizedRowData, schoolId, userId, context) {
        const roster = await attendanceService.markAttendance(
            context.class_id,
            {
                date: context.date,
                academic_year_id: context.academic_year_id,
                entries: [{ student_id: normalizedRowData.student_id, status: normalizedRowData.status, remarks: normalizedRowData.remarks }],
            },
            schoolId,
            userId
        );

        const match = roster.find((entry) => entry.student_id === normalizedRowData.student_id);
        return { entityId: match?.attendance_id ?? null };
    },
});
