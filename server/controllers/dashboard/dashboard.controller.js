import * as dashboardService from "../../services/dashboard/dashboard.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { DASHBOARD_MESSAGES } from "../../constants/messages/dashboard/dashboard.message.js";

export const getStats = async (req, res) => {
    const stats = await dashboardService.getStats(req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DASHBOARD_MESSAGES.STATS_FETCHED,
        data: stats,
    });
};

export const getRecentActivity = async (req, res) => {
    const activity = await dashboardService.getRecentActivity(req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DASHBOARD_MESSAGES.ACTIVITY_FETCHED,
        data: activity,
    });
};

export const getUpcomingEvents = async (req, res) => {
    const upcoming = await dashboardService.getUpcomingEvents(req.user.schoolId);

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: DASHBOARD_MESSAGES.UPCOMING_FETCHED,
        data: upcoming,
    });
};
