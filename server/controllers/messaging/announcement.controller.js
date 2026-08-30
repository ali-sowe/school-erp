import * as announcementService from "../../services/messaging/announcement.service.js";
import { asyncHandler } from "../../helpers/async-handler.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { ANNOUNCEMENT_MESSAGES } from "../../constants/messages/messaging/announcement.message.js";

export const createAnnouncement = asyncHandler(
    async (req, res) => {
        const announcement = await announcementService.createAnnouncement(req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.CREATED,
            data: announcement
        });
    }
);

export const getAnnouncements = asyncHandler(
    async (req, res) => {
        const announcements = await announcementService.getAnnouncements(req.user.schoolId, req.query.status);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.FETCHED_ALL,
            data: announcements
        });
    }
);

export const getAnnouncementById = asyncHandler(
    async (req, res) => {
        const announcement = await announcementService.getAnnouncementById(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.FETCHED,
            data: announcement
        });
    }
);

export const updateAnnouncement = asyncHandler(
    async (req, res) => {
        const announcement = await announcementService.updateAnnouncement(req.params.id, req.body, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.UPDATED,
            data: announcement
        });
    }
);

export const archiveAnnouncement = asyncHandler(
    async (req, res) => {
        const announcement = await announcementService.archiveAnnouncement(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.ARCHIVED,
            data: announcement
        });
    }
);

export const restoreAnnouncement = asyncHandler(
    async (req, res) => {
        const announcement = await announcementService.restoreAnnouncement(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.RESTORED,
            data: announcement
        });
    }
);

export const markAsRead = asyncHandler(
    async (req, res) => {
        await announcementService.markAsRead(req.params.id, req.user.schoolId, req.user.userId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.MARKED_AS_READ,
            data: null
        });
    }
);

export const getReaders = asyncHandler(
    async (req, res) => {
        const readers = await announcementService.getReaders(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.FETCHED,
            data: readers
        });
    }
);

export const getRecipients = asyncHandler(
    async (req, res) => {
        const recipients = await announcementService.getRecipients(req.params.id, req.user.schoolId);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: ANNOUNCEMENT_MESSAGES.RECIPIENTS_FETCHED,
            data: recipients
        });
    }
);
