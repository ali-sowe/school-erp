import * as feeStructureService from "../../services/finance/fee-structure.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { FEE_STRUCTURE_MESSAGES } from "../../constants/messages/finance/fee-structure.message.js";

export const createFeeStructure = asyncHandler(
    async (req, res) => {
        const feeStructure = await feeStructureService.createFeeStructure(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: FEE_STRUCTURE_MESSAGES.CREATED,
            data: feeStructure
        });
    }
);

export const getFeeStructures = asyncHandler(
    async (req, res) => {
        const feeStructures = await feeStructureService.getFeeStructures(req.user.schoolId, {
            academicYearId: req.query.academic_year_id,
            gradeLevelId: req.query.grade_level_id,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: FEE_STRUCTURE_MESSAGES.FETCHED_ALL,
            data: feeStructures
        });
    }
);

export const getFeeStructureById = asyncHandler(
    async (req, res) => {
        const feeStructure = await feeStructureService.getFeeStructureById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: FEE_STRUCTURE_MESSAGES.FETCHED,
            data: feeStructure
        });
    }
);

export const updateFeeStructure = asyncHandler(
    async (req, res) => {
        const feeStructure = await feeStructureService.updateFeeStructure(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: FEE_STRUCTURE_MESSAGES.UPDATED,
            data: feeStructure
        });
    }
);

export const archiveFeeStructure = asyncHandler(
    async (req, res) => {
        const feeStructure = await feeStructureService.archiveFeeStructure(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: FEE_STRUCTURE_MESSAGES.ARCHIVED,
            data: feeStructure
        });
    }
);

export const restoreFeeStructure = asyncHandler(
    async (req, res) => {
        const feeStructure = await feeStructureService.restoreFeeStructure(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: FEE_STRUCTURE_MESSAGES.RESTORED,
            data: feeStructure
        });
    }
);
