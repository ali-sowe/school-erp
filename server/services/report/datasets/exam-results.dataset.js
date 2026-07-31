import { registerReportDataset } from "../report-dataset-registry.js";
import * as examResultRepository from "../../../repositories/exam/exam-result.repository.js";
import { findOwnedExamOrThrow } from "../../../helpers/exam/exam.helper.js";
import { AppError } from "../../../helpers/app-error.helper.js";
import { HTTP_STATUS } from "../../../constants/httpStatus.js";
import { REPORT_MESSAGES } from "../../../constants/messages/report/report.message.js";

registerReportDataset('exam-results', {
    label: 'Exam Results',
    permissions: ['exams.read'],
    columns: [
        { key: 'student_id', label: 'Student ID', width: 12 },
        { key: 'subject_id', label: 'Subject ID', width: 12 },
        { key: 'score', label: 'Score', width: 10 },
        { key: 'max_score', label: 'Max Score', width: 10 },
        { key: 'remarks', label: 'Remarks', width: 24 }
    ],
    // Unlike students/teachers/invoices, this dataset is meaningless
    // without knowing *which* exam — filters.exam_id is required, and
    // ownership is checked here (the same tenant-scoping every other
    // module's own routes already give this data) since
    // exam_results.findForExam trusts the id it's given.
    fetch: async (schoolId, filters) => {
        if (!filters.exam_id) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, REPORT_MESSAGES.FILTER_REQUIRED);
        }

        await findOwnedExamOrThrow(filters.exam_id, schoolId);

        return await examResultRepository.findForExam(filters.exam_id, filters.subject_id || null);
    }
});
