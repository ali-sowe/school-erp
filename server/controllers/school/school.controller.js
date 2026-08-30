import * as schoolService from "../../services/school/school.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { SCHOOL_MESSAGES } from "../../constants/messages/school/school.message.js";

export const createSchool = asyncHandler(
    async (req, res) => {
        const school = await schoolService.createSchool(req.body);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: SCHOOL_MESSAGES.CREATED,
            data: school
        });
    }
);

export const getSchools = asyncHandler(
    async (req, res) => {
        const schools = await schoolService.getSchools();

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SCHOOL_MESSAGES.FETCHED_ALL,
            data: schools
        });
    }
);

export const getSchoolById = asyncHandler(
    async (req, res) => {
        const school = await schoolService.getSchoolById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SCHOOL_MESSAGES.FETCHED,
            data: school
        });
    }
);

export const updateSchool = asyncHandler(
    async (req, res) => {
        const school = await schoolService.updateSchool(req.params.id, req.body);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SCHOOL_MESSAGES.UPDATED,
            data: school
        });
    }
);

export const suspendSchool = asyncHandler(
    async (req, res) => {
        const school = await schoolService.suspendSchool(req.params.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SCHOOL_MESSAGES.SUSPENDED,
            data: school
        });
    }
);

export const reactivateSchool = asyncHandler(
    async (req, res) => {
        const school = await schoolService.reactivateSchool(req.params.id);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: SCHOOL_MESSAGES.REACTIVATED,
            data: school
        });
    }
);
