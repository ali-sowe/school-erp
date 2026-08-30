import * as guardianService from "../../services/student/guardian.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { GUARDIAN_MESSAGES } from "../../constants/messages/student/guardian.message.js";

export const createGuardian = asyncHandler(
    async (req, res) => {
        const guardian = await guardianService.createGuardian(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: GUARDIAN_MESSAGES.CREATED,
            data: guardian
        });
    }
);

export const getGuardians = asyncHandler(
    async (req, res) => {
        const guardians = await guardianService.getGuardians(req.user.schoolId, {
            search: req.query.search,
            status: req.query.status
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.FETCHED_ALL,
            data: guardians
        });
    }
);

export const getGuardianById = asyncHandler(
    async (req, res) => {
        const guardian = await guardianService.getGuardianById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.FETCHED,
            data: guardian
        });
    }
);

export const updateGuardian = asyncHandler(
    async (req, res) => {
        const guardian = await guardianService.updateGuardian(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.UPDATED,
            data: guardian
        });
    }
);

export const archiveGuardian = asyncHandler(
    async (req, res) => {
        const guardian = await guardianService.archiveGuardian(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.ARCHIVED,
            data: guardian
        });
    }
);

export const restoreGuardian = asyncHandler(
    async (req, res) => {
        const guardian = await guardianService.restoreGuardian(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.RESTORED,
            data: guardian
        });
    }
);

export const getStudentsForGuardian = asyncHandler(
    async (req, res) => {
        const students = await guardianService.getStudentsForGuardian(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.LINKS_FETCHED,
            data: students
        });
    }
);

// --- Nested under /students/:id/guardians ---

export const getGuardiansForStudent = asyncHandler(
    async (req, res) => {
        const guardians = await guardianService.getGuardiansForStudent(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.LINKS_FETCHED,
            data: guardians
        });
    }
);

export const linkGuardianToStudent = asyncHandler(
    async (req, res) => {
        const { guardian_id, relationship, is_primary_contact } = req.body;

        const guardians = await guardianService.linkGuardianToStudent(
            req.params.id,
            guardian_id,
            { relationship, isPrimaryContact: is_primary_contact },
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.LINKED,
            data: guardians
        });
    }
);

export const unlinkGuardianFromStudent = asyncHandler(
    async (req, res) => {
        const guardians = await guardianService.unlinkGuardianFromStudent(
            req.params.id,
            req.params.guardianId,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: GUARDIAN_MESSAGES.UNLINKED,
            data: guardians
        });
    }
);
