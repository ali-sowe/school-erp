import * as reportService from "../../services/report/report.service.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { REPORT_MESSAGES } from "../../constants/messages/report/report.message.js";
import { normalizePermissions } from "../../helpers/auth/permission.helper.js";

export const getAvailableReports = async (req, res) => {
    const reports = reportService.getAvailableReports(normalizePermissions(req.user.permissions));

    res.status(HTTP_STATUS.OK).json({
        success: true,
        message: REPORT_MESSAGES.FETCHED_ALL,
        data: reports
    });
};

// GET /api/reports/:key/download?format=xlsx|docx|pdf&<dataset-specific filters>
export const downloadReport = async (req, res) => {
    const format = String(req.query.format || 'xlsx').toLowerCase();

    const { buffer, filename, contentType } = await reportService.generateReport(
        req.params.key,
        format,
        req.user.schoolId,
        normalizePermissions(req.user.permissions),
        req.query
    );

    res.status(HTTP_STATUS.OK)
        .set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`
        })
        .send(buffer);
};
