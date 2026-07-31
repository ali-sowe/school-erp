import Joi from 'joi';
import { registerDataImporter } from '../importer-registry.js';
import { AppError } from '../../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../../constants/httpStatus.js';
import { findOwnedExamOrThrow } from '../../../helpers/exam/exam.helper.js';
import * as examSubjectRepository from '../../../repositories/exam/exam-subject.repository.js';
import * as studentRepository from '../../../repositories/student/student.repository.js';
import * as examResultService from '../../exam/exam-result.service.js';

const contextSchema = Joi.object({
    exam_id: Joi.number().integer().positive().required(),
    subject_id: Joi.number().integer().positive().required(),
});

const rowSchema = Joi.object({
    admission_number: Joi.string().trim().max(50).required(),
    score: Joi.number().min(0).required(),
    remarks: Joi.string().trim().max(255).allow('', null),
});

// Every row in an exam-marks spreadsheet is a score for the *same* exam and
// subject — that belongs to the batch, not each row, exactly what
// import_batches.context exists for. Resolved once here (exam exists and
// is ONGOING, the subject is actually on this exam) rather than repeated
// per row; the resolved max_score also travels along so validateRow can
// range-check every score without re-querying it each time.
registerDataImporter('EXAM_MARKS', {
    label: 'Exam Marks',
    expectedColumns: ['admission_number', 'score', 'remarks'],

    async resolveContext(context, schoolId) {
        const { error, value } = contextSchema.validate(context ?? {});
        if (error) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, `Import context is invalid: ${error.details.map((d) => d.message).join('; ')}`);
        }

        const exam = await findOwnedExamOrThrow(value.exam_id, schoolId);
        if (exam.status !== 'ONGOING') {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Marks can only be imported for an exam that is ONGOING.');
        }

        const examSubject = await examSubjectRepository.findMapping(value.exam_id, value.subject_id);
        if (!examSubject) {
            throw new AppError(HTTP_STATUS.BAD_REQUEST, 'This subject is not part of the given exam.');
        }

        return { exam_id: value.exam_id, subject_id: value.subject_id, max_score: Number(examSubject.max_score) };
    },

    async validateRow(rowData, schoolId, context) {
        const { error, value } = rowSchema.validate(rowData, { abortEarly: false, stripUnknown: true });
        if (error) {
            return { valid: false, errors: error.details.map((detail) => detail.message) };
        }

        const student = await studentRepository.findByAdmissionNumber(schoolId, value.admission_number);
        if (!student) {
            return { valid: false, errors: [`No student found with admission number "${value.admission_number}".`] };
        }

        if (value.score > context.max_score) {
            return { valid: false, errors: [`Score ${value.score} exceeds this subject's maximum of ${context.max_score}.`] };
        }

        return {
            valid: true,
            errors: [],
            normalized: { student_id: student.id, score: value.score, remarks: value.remarks ?? null },
        };
    },

    // recordResults is written for a whole class's worth of entries at
    // once; called here with a single-entry array so every row still goes
    // through its real validation (roster membership, duplicate guard,
    // score range) rather than a parallel path that could drift from it.
    async importRow(normalizedRowData, schoolId, userId, context) {
        const results = await examResultService.recordResults(
            context.exam_id,
            {
                subject_id: context.subject_id,
                entries: [{ student_id: normalizedRowData.student_id, score: normalizedRowData.score, remarks: normalizedRowData.remarks }],
            },
            schoolId,
            userId
        );

        const match = results.find((result) => result.student_id === normalizedRowData.student_id);
        return { entityId: match?.id ?? null };
    },
});
