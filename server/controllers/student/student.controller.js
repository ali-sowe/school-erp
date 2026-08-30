import * as studentService from "../../services/student/student.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { STUDENT_MESSAGES } from "../../constants/messages/student/student.message.js";

export const createStudent = asyncHandler(
    async (req, res) => {
        const student = await studentService.createStudent(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: STUDENT_MESSAGES.CREATED,
            data: student
        });
    }
);

export const getStudents = asyncHandler(
    async (req, res) => {
        const students = await studentService.getStudents(req.user.schoolId, {
            search: req.query.search,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: STUDENT_MESSAGES.FETCHED_ALL,
            data: students
        });
    }
);

export const getStudentById = asyncHandler(
    async (req, res) => {
        const student = await studentService.getStudentById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: STUDENT_MESSAGES.FETCHED,
            data: student
        });
    }
);

export const updateStudent = asyncHandler(
    async (req, res) => {
        const student = await studentService.updateStudent(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: STUDENT_MESSAGES.UPDATED,
            data: student
        });
    }
);

export const archiveStudent = asyncHandler(
    async (req, res) => {
        const student = await studentService.archiveStudent(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: STUDENT_MESSAGES.ARCHIVED,
            data: student
        });
    }
);

export const restoreStudent = asyncHandler(
    async (req, res) => {
        const student = await studentService.restoreStudent(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: STUDENT_MESSAGES.RESTORED,
            data: student
        });
    }
);
