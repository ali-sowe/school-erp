import * as subjectService from "../../services/subject/subject.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { SUBJECT_MESSAGES } from "../../constants/messages/subject/subject.message.js";

export const createSubject = asyncHandler(
    async (req, res) => {
        const subject = await subjectService.createSubject(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SUBJECT_MESSAGES.CREATED,
            data: subject
        });
    }
);

export const getSubjects = asyncHandler(
    async (req, res) => {
        const subjects = await subjectService.getSubjects(req.user.schoolId, req.query.status);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUBJECT_MESSAGES.FETCHED_ALL,
            data: subjects
        });
    }
);

export const getSubjectById = asyncHandler(
    async (req, res) => {
        const subject = await subjectService.getSubjectById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUBJECT_MESSAGES.FETCHED,
            data: subject
        });
    }
);

export const updateSubject = asyncHandler(
    async (req, res) => {
        const subject = await subjectService.updateSubject(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUBJECT_MESSAGES.UPDATED,
            data: subject
        });
    }
);

export const archiveSubject = asyncHandler(
    async (req, res) => {
        const subject = await subjectService.archiveSubject(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUBJECT_MESSAGES.ARCHIVED,
            data: subject
        });
    }
);

export const restoreSubject = asyncHandler(
    async (req, res) => {
        const subject = await subjectService.restoreSubject(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SUBJECT_MESSAGES.RESTORED,
            data: subject
        });
    }
);
