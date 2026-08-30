import * as attendanceService from "../../services/attendance/attendance.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ATTENDANCE_MESSAGES } from "../../constants/messages/attendance/attendance.message.js";

// POST /api/classes/:id/attendance
export const markAttendance = async (req, res) => {
    const attendance = await attendanceService.markAttendance(
        req.params.id,
        req.body,
        req.user.schoolId,
        req.user.userId
    );

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: ATTENDANCE_MESSAGES.MARKED,
        data: attendance
    });
};

// GET /api/classes/:id/attendance?date=&academic_year_id=
export const getClassAttendanceForDate = async (req, res) => {
    const attendance = await attendanceService.getClassAttendanceForDate(
        req.params.id,
        req.query.date,
        req.query.academic_year_id,
        req.user.schoolId
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: ATTENDANCE_MESSAGES.FETCHED_ALL,
        data: attendance
    });
};

// GET /api/classes/:id/attendance/summary?from=&to=
export const getClassAttendanceSummary = async (req, res) => {
    const summary = await attendanceService.getClassAttendanceSummary(
        req.params.id,
        { from: req.query.from, to: req.query.to },
        req.user.schoolId
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: ATTENDANCE_MESSAGES.SUMMARY_FETCHED,
        data: summary
    });
};

// GET /api/students/:id/attendance?from=&to=
export const getStudentAttendanceHistory = async (req, res) => {
    const history = await attendanceService.getStudentAttendanceHistory(
        req.params.id,
        { from: req.query.from, to: req.query.to },
        req.user.schoolId
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: ATTENDANCE_MESSAGES.FETCHED_ALL,
        data: history
    });
};

// PATCH /api/attendance/:id
export const updateAttendanceRecord = async (req, res) => {
    const record = await attendanceService.updateAttendanceRecord(
        req.params.id,
        req.body,
        req.user.schoolId,
        req.user.userId
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: ATTENDANCE_MESSAGES.UPDATED,
        data: record
    });
};
