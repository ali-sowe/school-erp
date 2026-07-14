import * as academicYearService from "../../services/academic-year/academic-year.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpstatus.js";
import { AUTH_MESSAGES } from "../../constants/messages/auth.message.js";
import { ACADEMIC_YEAR_MESSAGES } from "../../constants/messages/academic-year/academic-year.message.js";

export const createAcademicYear = asyncHandler(
    async (req, res) => {
        const academicYear = await academicYearService.createAcademicYear(req.body);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: ACADEMIC_YEAR_MESSAGES.CREATED,
            data: academicYear
        });
    }
);

export const getAcademicYears = asyncHandler(
    async (req, res) => {
        const academicYears = await academicYearService.getAcademicYears();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ACADEMIC_YEAR_MESSAGES.FETCHED_ALL,
            data: academicYears
        });
    }
);

export const getAcademicYearById = asyncHandler(
    async (req, res) => {
        const academicYear = await academicYearService.getAcademicYearById(req.params.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ACADEMIC_YEAR_MESSAGES.FETCHED,
            data: academicYear
        });
    }
);

export const updateAcademicYear = asyncHandler(
    async (req, res) => {
        const academicYear = await academicYearService.updateAcademicYear(req.params.id, req.body);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ACADEMIC_YEAR_MESSAGES.UPDATED,
            data: academicYear
        });
    }
);

export const activateAcademicYear = asyncHandler(
    async (req, res) => {
        const academicYear = await academicYearService.activateAcademicYear(req.params.id);
        
        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ACADEMIC_YEAR_MESSAGES.ACTIVATED,
            data: academicYear
        });
    }
);

export const closeAcademicYear = asyncHandler(
    async (req, res) => {
        const academicYear = await academicYearService.closeAcademicYear(req.params.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ACADEMIC_YEAR_MESSAGES.CLOSED,
            data: academicYear
        });
    }
);