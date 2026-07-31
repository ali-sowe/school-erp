import * as examResultService from "../../services/exam/exam-result.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { EXAM_RESULT_MESSAGES } from "../../constants/messages/exam/exam-result.message.js";

// POST /api/exams/:id/results
export const recordResults = async (req, res) => {
    const results = await examResultService.recordResults(req.params.id, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: EXAM_RESULT_MESSAGES.RECORDED,
        data: results
    });
};

// GET /api/exams/:id/results?subject_id=
export const getResultsForExam = async (req, res) => {
    const results = await examResultService.getResultsForExam(req.params.id, req.query.subject_id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: EXAM_RESULT_MESSAGES.FETCHED_ALL,
        data: results
    });
};

// GET /api/exams/:id/summary
export const getExamSummary = async (req, res) => {
    const summary = await examResultService.getExamSummary(req.params.id, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: EXAM_RESULT_MESSAGES.FETCHED_ALL,
        data: summary
    });
};

// GET /api/students/:id/exam-results?academic_year_id=&term_id=
export const getStudentResults = async (req, res) => {
    const results = await examResultService.getStudentResults(
        req.params.id,
        { academicYearId: req.query.academic_year_id, termId: req.query.term_id },
        req.user.schoolId
    );

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: EXAM_RESULT_MESSAGES.FETCHED_ALL,
        data: results
    });
};

// PATCH /api/exam-results/:id
export const updateExamResult = async (req, res) => {
    const result = await examResultService.updateExamResult(req.params.id, req.body, req.user.schoolId, req.user.userId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: EXAM_RESULT_MESSAGES.UPDATED,
        data: result
    });
};
