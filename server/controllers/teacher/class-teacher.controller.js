import * as classTeacherService from "../../services/teacher/class-teacher.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CLASS_TEACHER_MESSAGES } from "../../constants/messages/teacher/class-teacher.message.js";

// PUT /api/classes/:id/class-teacher
export const assignClassTeacher = asyncHandler(
    async (req, res) => {
        const assignment = await classTeacherService.assignClassTeacher(
            { ...req.body, class_id: req.params.id },
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_TEACHER_MESSAGES.ASSIGNED,
            data: assignment
        });
    }
);

// GET /api/classes/:id/class-teacher?academic_year_id=
export const getClassTeacher = asyncHandler(
    async (req, res) => {
        const assignment = await classTeacherService.getClassTeacher(
            req.params.id,
            req.query.academic_year_id,
            req.user.schoolId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_TEACHER_MESSAGES.FETCHED,
            data: assignment
        });
    }
);

// GET /api/teachers/:id/class-teacher-assignments
export const getClassesForTeacher = asyncHandler(
    async (req, res) => {
        const assignments = await classTeacherService.getClassesForTeacher(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_TEACHER_MESSAGES.FETCHED_ALL,
            data: assignments
        });
    }
);

// PATCH /api/class-teacher-assignments/:assignmentId/end
export const endClassTeacherAssignment = asyncHandler(
    async (req, res) => {
        const assignment = await classTeacherService.endClassTeacherAssignment(
            req.params.assignmentId,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_TEACHER_MESSAGES.ENDED,
            data: assignment
        });
    }
);
