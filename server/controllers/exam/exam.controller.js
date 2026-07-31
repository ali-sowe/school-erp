import * as examService from "../../services/exam/exam.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXAM_MESSAGES } from "../../constants/messages/exam/exam.message.js";

export const createExam = asyncHandler(
    async (req, res) => {
        const exam = await examService.createExam(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: EXAM_MESSAGES.CREATED,
            data: exam
        });
    }
);

export const getExams = asyncHandler(
    async (req, res) => {
        const exams = await examService.getExams(req.user.schoolId, {
            classId: req.query.class_id,
            academicYearId: req.query.academic_year_id,
            termId: req.query.term_id,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.FETCHED_ALL,
            data: exams
        });
    }
);

export const getExamById = asyncHandler(
    async (req, res) => {
        const exam = await examService.getExamById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.FETCHED,
            data: exam
        });
    }
);

export const updateExam = asyncHandler(
    async (req, res) => {
        const exam = await examService.updateExam(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.UPDATED,
            data: exam
        });
    }
);

export const startExam = asyncHandler(
    async (req, res) => {
        const exam = await examService.startExam(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.STARTED,
            data: exam
        });
    }
);

export const completeExam = asyncHandler(
    async (req, res) => {
        const exam = await examService.completeExam(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.COMPLETED,
            data: exam
        });
    }
);

export const reopenExam = asyncHandler(
    async (req, res) => {
        const exam = await examService.reopenExam(req.params.id, req.body.reason, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.REOPENED,
            data: exam
        });
    }
);

export const getExamSubjects = asyncHandler(
    async (req, res) => {
        const subjects = await examService.getExamSubjects(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.FETCHED_ALL,
            data: subjects
        });
    }
);

export const addExamSubject = asyncHandler(
    async (req, res) => {
        const subjects = await examService.addExamSubject(
            req.params.id,
            req.body.subject_id,
            req.body.max_score,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.FETCHED_ALL,
            data: subjects
        });
    }
);

export const removeExamSubject = asyncHandler(
    async (req, res) => {
        const subjects = await examService.removeExamSubject(
            req.params.id,
            req.params.subjectId,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: EXAM_MESSAGES.FETCHED_ALL,
            data: subjects
        });
    }
);
