import * as classService from "../../services/class/class.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CLASS_MESSAGES } from "../../constants/messages/class/class.message.js";

export const createClass = asyncHandler(
    async (req, res) => {
        const classRecord = await classService.createClass(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: CLASS_MESSAGES.CREATED,
            data: classRecord
        });
    }
);

export const getClasses = asyncHandler(
    async (req, res) => {
        const classes = await classService.getClasses(req.user.schoolId, {
            gradeLevelId: req.query.grade_level_id,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.FETCHED_ALL,
            data: classes
        });
    }
);

export const getClassById = asyncHandler(
    async (req, res) => {
        const classRecord = await classService.getClassById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.FETCHED,
            data: classRecord
        });
    }
);

export const updateClass = asyncHandler(
    async (req, res) => {
        const classRecord = await classService.updateClass(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.UPDATED,
            data: classRecord
        });
    }
);

export const archiveClass = asyncHandler(
    async (req, res) => {
        const classRecord = await classService.archiveClass(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.ARCHIVED,
            data: classRecord
        });
    }
);

export const restoreClass = asyncHandler(
    async (req, res) => {
        const classRecord = await classService.restoreClass(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.RESTORED,
            data: classRecord
        });
    }
);

export const getClassSubjects = asyncHandler(
    async (req, res) => {
        const subjects = await classService.getClassSubjects(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.SUBJECTS_FETCHED,
            data: subjects
        });
    }
);

export const assignSubjectToClass = asyncHandler(
    async (req, res) => {
        const subjects = await classService.assignSubjectToClass(
            req.params.id,
            req.body.subject_id,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.SUBJECT_ASSIGNED,
            data: subjects
        });
    }
);

export const removeSubjectFromClass = asyncHandler(
    async (req, res) => {
        const subjects = await classService.removeSubjectFromClass(
            req.params.id,
            req.params.subjectId,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CLASS_MESSAGES.SUBJECT_REMOVED,
            data: subjects
        });
    }
);
