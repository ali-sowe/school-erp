import * as gradeLevelService from "../../services/grade-level/grade-level.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { GRADE_LEVEL_MESSAGES } from "../../constants/messages/grade-level/grade-level.message.js";

export const createGradeLevel = asyncHandler(
    async (req, res) => {
        const gradeLevel = await gradeLevelService.createGradeLevel(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: GRADE_LEVEL_MESSAGES.CREATED,
            data: gradeLevel
        });
    }
);

export const getGradeLevels = asyncHandler(
    async (req, res) => {
        const gradeLevels = await gradeLevelService.getGradeLevels(req.user.schoolId, req.query.status);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GRADE_LEVEL_MESSAGES.FETCHED_ALL,
            data: gradeLevels
        });
    }
);

export const getGradeLevelById = asyncHandler(
    async (req, res) => {
        const gradeLevel = await gradeLevelService.getGradeLevelById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GRADE_LEVEL_MESSAGES.FETCHED,
            data: gradeLevel
        });
    }
);

export const updateGradeLevel = asyncHandler(
    async (req, res) => {
        const gradeLevel = await gradeLevelService.updateGradeLevel(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GRADE_LEVEL_MESSAGES.UPDATED,
            data: gradeLevel
        });
    }
);

export const archiveGradeLevel = asyncHandler(
    async (req, res) => {
        const gradeLevel = await gradeLevelService.archiveGradeLevel(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GRADE_LEVEL_MESSAGES.ARCHIVED,
            data: gradeLevel
        });
    }
);

export const restoreGradeLevel = asyncHandler(
    async (req, res) => {
        const gradeLevel = await gradeLevelService.restoreGradeLevel(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GRADE_LEVEL_MESSAGES.RESTORED,
            data: gradeLevel
        });
    }
);
