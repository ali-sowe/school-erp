import * as parentPortalService from "../../services/portal/parent-portal.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { PORTAL_MESSAGES } from "../../constants/messages/portal/portal.message.js";

export const getMyChildren = async (req, res) => {
    const children = await parentPortalService.getMyChildren(req.user.userId);

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: children });
};

export const getChildAttendance = async (req, res) => {
    const records = await parentPortalService.getChildAttendance(req.user.userId, req.params.studentId, {
        from: req.query.from,
        to: req.query.to
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: records });
};

export const getChildExamResults = async (req, res) => {
    const results = await parentPortalService.getChildExamResults(req.user.userId, req.params.studentId, {
        academicYearId: req.query.academic_year_id,
        termId: req.query.term_id
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: results });
};

export const getChildInvoices = async (req, res) => {
    const invoices = await parentPortalService.getChildInvoices(req.user.userId, req.params.studentId, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: invoices });
};

export const getChildLibraryBorrows = async (req, res) => {
    const borrows = await parentPortalService.getChildLibraryBorrows(req.user.userId, req.params.studentId, {
        from: req.query.from,
        to: req.query.to
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: borrows });
};

export const getChildAnnouncements = async (req, res) => {
    const announcements = await parentPortalService.getChildAnnouncements(req.user.userId, req.params.studentId, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: announcements });
};

export const markAnnouncementRead = async (req, res) => {
    await parentPortalService.markAnnouncementRead(req.user.userId, req.params.announcementId, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: null });
};
