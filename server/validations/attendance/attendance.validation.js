import Joi from 'joi';
import { ATTENDANCE_STATUSES } from '../../helpers/attendance/attendance.helper.js';

const attendanceEntrySchema = Joi.object({
    student_id: Joi.number().integer().positive().required(),
    status: Joi.string().valid(...ATTENDANCE_STATUSES).required(),
    remarks: Joi.string().trim().max(255).allow('', null)
});

export const markAttendanceSchema = Joi.object({
    date: Joi.date().iso().required(),
    academic_year_id: Joi.number().integer().positive(),
    entries: Joi.array().items(attendanceEntrySchema).min(1).required()
});

export const updateAttendanceSchema = Joi.object({
    status: Joi.string().valid(...ATTENDANCE_STATUSES),
    remarks: Joi.string().trim().max(255).allow('', null)
}).min(1);
