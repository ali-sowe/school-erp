import * as studentPortalService from "../../services/portal/student-portal.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { PORTAL_MESSAGES } from "../../constants/messages/portal/portal.message.js";

export const getMyProfile = async (req, res) => {
    const student = await studentPortalService.getMyProfile(req.user.userId);

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: student });
};

export const getMyAttendance = async (req, res) => {
    const records = await studentPortalService.getMyAttendance(req.user.userId, {
        from: req.query.from,
        to: req.query.to
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: records });
};

export const getMyExamResults = async (req, res) => {
    const results = await studentPortalService.getMyExamResults(req.user.userId, {
        academicYearId: req.query.academic_year_id,
        termId: req.query.term_id
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: results });
};

export const getMyLibraryBorrows = async (req, res) => {
    const borrows = await studentPortalService.getMyLibraryBorrows(req.user.userId, {
        from: req.query.from,
        to: req.query.to
    });

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: borrows });
};

export const getMyAnnouncements = async (req, res) => {
    const announcements = await studentPortalService.getMyAnnouncements(req.user.userId, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: announcements });
};

export const markAnnouncementRead = async (req, res) => {
    await studentPortalService.markAnnouncementRead(req.user.userId, req.params.announcementId, req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({ success: true, message: PORTAL_MESSAGES.FETCHED, data: null });
};
