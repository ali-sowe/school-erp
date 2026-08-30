import * as teacherSubjectAssignmentService from "../../services/teacher/teacher-subject-assignment.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { TEACHER_SUBJECT_ASSIGNMENT_MESSAGES } from "../../constants/messages/teacher/teacher-subject-assignment.message.js";

// POST /api/classes/:id/subject-teachers
export const assignTeacher = asyncHandler(
    async (req, res) => {
        const assignment = await teacherSubjectAssignmentService.assignTeacher(
            { ...req.body, class_id: req.params.id },
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.ASSIGNED,
            data: assignment
        });
    }
);

// GET /api/classes/:id/subject-teachers?academic_year_id=
export const getAssignmentsForClass = asyncHandler(
    async (req, res) => {
        const assignments = await teacherSubjectAssignmentService.getAssignmentsForClass(
            req.params.id,
            req.query.academic_year_id,
            req.user.schoolId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.FETCHED_ALL,
            data: assignments
        });
    }
);

// GET /api/teachers/:id/subject-assignments?academic_year_id=
export const getAssignmentsForTeacher = asyncHandler(
    async (req, res) => {
        const assignments = await teacherSubjectAssignmentService.getAssignmentsForTeacher(
            req.params.id,
            req.query.academic_year_id,
            req.user.schoolId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.FETCHED_ALL,
            data: assignments
        });
    }
);

// PATCH /api/teacher-subject-assignments/:assignmentId/end
export const endAssignment = asyncHandler(
    async (req, res) => {
        const assignment = await teacherSubjectAssignmentService.endAssignment(
            req.params.assignmentId,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: TEACHER_SUBJECT_ASSIGNMENT_MESSAGES.ENDED,
            data: assignment
        });
    }
);
