import * as teacherService from "../../services/teacher/teacher.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TEACHER_MESSAGES } from "../../constants/messages/teacher/teacher.message.js";

export const createTeacher = asyncHandler(
    async (req, res) => {
        const teacher = await teacherService.createTeacher(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: TEACHER_MESSAGES.CREATED,
            data: teacher
        });
    }
);

export const getTeachers = asyncHandler(
    async (req, res) => {
        const teachers = await teacherService.getTeachers(req.user.schoolId, {
            search: req.query.search,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_MESSAGES.FETCHED_ALL,
            data: teachers
        });
    }
);

export const getTeacherById = asyncHandler(
    async (req, res) => {
        const teacher = await teacherService.getTeacherById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_MESSAGES.FETCHED,
            data: teacher
        });
    }
);

export const updateTeacher = asyncHandler(
    async (req, res) => {
        const teacher = await teacherService.updateTeacher(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_MESSAGES.UPDATED,
            data: teacher
        });
    }
);

export const archiveTeacher = asyncHandler(
    async (req, res) => {
        const teacher = await teacherService.archiveTeacher(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_MESSAGES.ARCHIVED,
            data: teacher
        });
    }
);

export const restoreTeacher = asyncHandler(
    async (req, res) => {
        const teacher = await teacherService.restoreTeacher(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_MESSAGES.RESTORED,
            data: teacher
        });
    }
);
