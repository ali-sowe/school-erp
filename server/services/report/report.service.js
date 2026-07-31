import { getReportDataset, listReportDatasets } from "./report-dataset-registry.js";
import { buildXlsx } from "../../helpers/export/xlsx-export.helper.js";
import { buildDocx } from "../../helpers/export/docx-export.helper.js";
import { buildPdf } from "../../helpers/export/pdf-export.helper.js";
import { AppError } from "../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../constants/httpStatus.js";
import { REPORT_MESSAGES } from "../../constants/messages/report/report.message.js";

// Side-effect imports — each registers its own dataset key. Adding a new
// exportable dataset is exactly this: a new file, a new line here; the
// engine below never changes. Same pattern as import-batch.service.js's
// importers/*.js imports.
import "./datasets/students.dataset.js";
import "./datasets/teachers.dataset.js";
import "./datasets/exam-results.dataset.js";
import "./datasets/invoices.dataset.js";
import "./datasets/expenses.dataset.js";
import "./datasets/attendance.dataset.js";
import "./datasets/library-borrow-records.dataset.js";
import "./datasets/payments.dataset.js";

const BUILDERS = { xlsx: buildXlsx, docx: buildDocx, pdf: buildPdf };

const FILE_EXTENSIONS = { xlsx: 'xlsx', docx: 'docx', pdf: 'pdf' };

const CONTENT_TYPES = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf'
};

function ensureDatasetAccessible(dataset, userPermissions) {
    const hasAccess = dataset.permissions.every((permission) => userPermissions.includes(permission));

    if (!hasAccess) {
        throw new AppError(HTTP_STATUS.FORBIDDEN, REPORT_MESSAGES.DATASET_FORBIDDEN);
    }
}

// Only the datasets this user's permissions actually allow — the generic
// 'reports.read' gate on the route just means "can use the reporting
// feature at all", not "can see every module's data" (e.g. a Teacher
// shouldn't see the finance dataset in their list just because they can
// export something).
export function getAvailableReports(userPermissions) {
    return listReportDatasets().filter((dataset) => dataset.permissions.every((permission) => userPermissions.includes(permission)));
}

// Generic across every registered dataset (students, teachers, exam
// results, invoices, ...): look up its definition, fetch its rows the way
// that module defines (scoped to this school), then hand the same
// {columns, rows} shape to whichever format builder was asked for. This
// function never knows what a "student" or "invoice" is.
export async function generateReport(datasetKey, format, schoolId, userPermissions, filters = {}) {
    const dataset = getReportDataset(datasetKey);
    if (!dataset) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, REPORT_MESSAGES.DATASET_NOT_FOUND);
    }

    ensureDatasetAccessible(dataset, userPermissions);

    const builder = BUILDERS[format];
    if (!builder) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, REPORT_MESSAGES.UNSUPPORTED_FORMAT);
    }

    const rows = await dataset.fetch(schoolId, filters);

    const buffer = await builder({
        title: dataset.label,
        sheetName: dataset.label,
        columns: dataset.columns,
        rows
    });

    return {
        buffer,
        filename: `${datasetKey}.${FILE_EXTENSIONS[format]}`,
        contentType: CONTENT_TYPES[format]
    };
}
