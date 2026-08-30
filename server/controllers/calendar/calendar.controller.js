import * as calendarService from "../../services/calendar/calendar.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { CALENDAR_MESSAGES } from "../../constants/messages/calendar/calendar.message.js";

export const createEvent = asyncHandler(
    async (req, res) => {
        const event = await calendarService.createEvent(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: CALENDAR_MESSAGES.CREATED,
            data: event
        });
    }
);

export const getEvents = asyncHandler(
    async (req, res) => {
        const events = await calendarService.getEvents(req.user.schoolId, {
            academicYearId: req.query.academic_year_id,
            category: req.query.category,
            status: req.query.status,
            from: req.query.from,
            to: req.query.to
        });

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CALENDAR_MESSAGES.FETCHED_ALL,
            data: events
        });
    }
);

export const getEventById = asyncHandler(
    async (req, res) => {
        const event = await calendarService.getEventById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CALENDAR_MESSAGES.FETCHED,
            data: event
        });
    }
);

export const updateEvent = asyncHandler(
    async (req, res) => {
        const event = await calendarService.updateEvent(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CALENDAR_MESSAGES.UPDATED,
            data: event
        });
    }
);

export const archiveEvent = asyncHandler(
    async (req, res) => {
        const event = await calendarService.archiveEvent(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CALENDAR_MESSAGES.ARCHIVED,
            data: event
        });
    }
);

export const restoreEvent = asyncHandler(
    async (req, res) => {
        const event = await calendarService.restoreEvent(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: CALENDAR_MESSAGES.RESTORED,
            data: event
        });
    }
);

export const copyEventsToYear = asyncHandler(
    async (req, res) => {
        const events = await calendarService.copyEventsToYear(
            req.body.source_academic_year_id,
            req.body.target_academic_year_id,
            req.user.schoolId,
            req.user.userId
        );

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: CALENDAR_MESSAGES.COPIED,
            data: events
        });
    }
);
