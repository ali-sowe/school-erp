import path from 'path';
import env from '../../config/env.js';
import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { DATA_IMPORT_MESSAGES } from '../../constants/messages/data-import/data-import.message.js';
import { IMPORT_BATCH_STATUS, IMPORT_ROW_STATUS } from '../../constants/data-import.constants.js';
import { DOCUMENT_KIND } from '../../constants/document.constants.js';
import { findOwnedDocumentOrThrow } from '../../helpers/document/document.helper.js';
import { findOwnedImportBatchOrThrow } from '../../helpers/data-import/data-import.helper.js';
import { parseSpreadsheetToRows } from '../../helpers/data-import/spreadsheet.helper.js';
import { getDataImporter, listDataImporters } from './importer-registry.js';
import * as importBatchRepository from '../../repositories/data-import/import-batch.repository.js';
import * as importBatchRowRepository from '../../repositories/data-import/import-batch-row.repository.js';
import * as auditRepository from '../../repositories/audit/audit.repository.js';

// Side-effect imports — each registers its own target_type. Adding a new
// importer is exactly this: a new file, a new line here; the engine above
// never changes.
import './importers/student.importer.js';
import './importers/teacher.importer.js';
import './importers/exam-marks.importer.js';
import './importers/fee-structure.importer.js';
import './importers/attendance.importer.js';

function resolveAbsolutePath(storagePath) {
    return path.resolve(process.cwd(), env.uploads.dir, storagePath);
}

export function getAvailableImportTypes() {
    return listDataImporters();
}

// Parses the spreadsheet and validates every row up front (rather than
// lazily on confirm) so the full "import preview" the ADR requires —
// what will happen, before it happens — is available immediately after
// upload, the same "show the whole picture, not just the next step"
// reasoning as approval_steps being created up front for a whole chain.
export async function createImportBatch(documentId, targetType, context, schoolId, userId = null) {
    const document = await findOwnedDocumentOrThrow(documentId, schoolId);

    if (document.kind !== DOCUMENT_KIND.DATA) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DATA_IMPORT_MESSAGES.DOCUMENT_NOT_A_DATA_DOCUMENT);
    }

    const importer = getDataImporter(targetType);
    if (!importer) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DATA_IMPORT_MESSAGES.UNSUPPORTED_TARGET_TYPE);
    }

    // Optional hook for importers whose rows need something resolved once
    // for the whole batch rather than repeated on every row — e.g. exam
    // marks rows only carry a score, but need to know which exam/subject
    // they're scores *for*; that context is looked up and validated here
    // (wrong exam id, exam not ONGOING, etc. surface immediately, before a
    // single row is parsed) and the *resolved* result is what's persisted
    // as the batch's context — confirmImportBatch reads it back unchanged,
    // so the lookup never needs to happen twice.
    const resolvedContext = importer.resolveContext
        ? await importer.resolveContext(context, schoolId)
        : (context ?? null);

    const parsedRows = await parseSpreadsheetToRows(resolveAbsolutePath(document.storage_path), document.file_extension);

    const batchId = await importBatchRepository.create(
        {
            school_id: schoolId,
            document_id: documentId,
            target_type: targetType,
            context: resolvedContext,
            total_rows: parsedRows.length,
        },
        userId
    );

    if (parsedRows.length === 0) {
        await importBatchRepository.updateValidationResult(batchId, {
            status: IMPORT_BATCH_STATUS.FAILED_VALIDATION,
            validRows: 0,
            invalidRows: 0,
            validationError: DATA_IMPORT_MESSAGES.EMPTY_SPREADSHEET,
        });
        return await importBatchRepository.findById(batchId);
    }

    let validCount = 0;
    let invalidCount = 0;

    for (const { rowNumber, data } of parsedRows) {
        const result = await importer.validateRow(data, schoolId, resolvedContext);

        await importBatchRowRepository.create({
            import_batch_id: batchId,
            row_number: rowNumber,
            raw_data: data,
            normalized_data: result.valid ? result.normalized : null,
            status: result.valid ? IMPORT_ROW_STATUS.VALID : IMPORT_ROW_STATUS.INVALID,
            errors: result.valid ? null : result.errors,
        });

        if (result.valid) {
            validCount += 1;
        } else {
            invalidCount += 1;
        }
    }

    await importBatchRepository.updateValidationResult(batchId, {
        status: IMPORT_BATCH_STATUS.VALIDATED,
        validRows: validCount,
        invalidRows: invalidCount,
    });

    return await importBatchRepository.findById(batchId);
}

export async function getImportBatches(schoolId, filters) {
    return await importBatchRepository.findAll(schoolId, filters);
}

export async function getImportBatchById(id, schoolId) {
    return await findOwnedImportBatchOrThrow(id, schoolId);
}

export async function getImportBatchRows(id, schoolId, filters) {
    await findOwnedImportBatchOrThrow(id, schoolId);
    return await importBatchRowRepository.findByBatchId(id, filters);
}

// The "require user confirmation" step from the ADR — only VALID rows are
// written to ERP tables; INVALID rows are simply left out (visible in the
// row list, never silently dropped). A row failing at import time (e.g. a
// DB constraint the validator couldn't see) marks that row FAILED without
// aborting the rest of the batch — partial success is still progress for
// someone importing 200 students.
export async function confirmImportBatch(id, schoolId, userId = null) {
    const batch = await findOwnedImportBatchOrThrow(id, schoolId);

    if (batch.status !== IMPORT_BATCH_STATUS.VALIDATED) {
        const message = batch.status === IMPORT_BATCH_STATUS.IMPORTED || batch.status === IMPORT_BATCH_STATUS.PARTIALLY_IMPORTED
            ? DATA_IMPORT_MESSAGES.ALREADY_CONFIRMED
            : DATA_IMPORT_MESSAGES.NOT_READY_TO_CONFIRM;
        throw new AppError(HTTP_STATUS.BAD_REQUEST, message);
    }

    const importer = getDataImporter(batch.target_type);
    if (!importer) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DATA_IMPORT_MESSAGES.UNSUPPORTED_TARGET_TYPE);
    }

    const validRows = await importBatchRowRepository.findByBatchId(id, { status: IMPORT_ROW_STATUS.VALID });

    let importedCount = 0;
    let failedCount = 0;
    // Notes returned by importRow (e.g. "temporary password: ...") are
    // surfaced in this one confirm response and never written to the
    // database — see student-vs-teacher comment in student.importer.js
    // for why persisting a generated secret anywhere would be a mistake.
    const rowNotes = [];

    for (const row of validRows) {
        try {
            const { entityId, note } = await importer.importRow(row.normalized_data, schoolId, userId, batch.context);
            await importBatchRowRepository.updateImportOutcome(row.id, {
                status: IMPORT_ROW_STATUS.IMPORTED,
                importedEntityId: entityId,
            });
            importedCount += 1;

            if (note) {
                rowNotes.push({ row_number: row.row_number, note });
            }
        } catch (error) {
            await importBatchRowRepository.updateImportOutcome(row.id, {
                status: IMPORT_ROW_STATUS.FAILED,
                errors: [error.message],
            });
            failedCount += 1;
        }
    }

    const finalStatus = failedCount === 0 ? IMPORT_BATCH_STATUS.IMPORTED : IMPORT_BATCH_STATUS.PARTIALLY_IMPORTED;

    await importBatchRepository.updateImportResult(id, {
        status: finalStatus,
        importedRows: importedCount,
        failedRows: failedCount,
        confirmedBy: userId,
    });

    await auditRepository.createAuditLog({
        schoolId,
        entityType: 'ImportBatch',
        entityId: id,
        action: 'CONFIRMED',
        oldValues: { status: batch.status },
        newValues: { status: finalStatus, imported_rows: importedCount, failed_rows: failedCount },
        reason: `Confirmed import of ${batch.target_type}`,
        performedBy: userId,
    });

    return { ...(await importBatchRepository.findById(id)), row_notes: rowNotes };
}

export async function cancelImportBatch(id, schoolId, userId = null) {
    const batch = await findOwnedImportBatchOrThrow(id, schoolId);

    const cancellableStatuses = [IMPORT_BATCH_STATUS.PENDING_VALIDATION, IMPORT_BATCH_STATUS.VALIDATED, IMPORT_BATCH_STATUS.FAILED_VALIDATION];
    if (!cancellableStatuses.includes(batch.status)) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DATA_IMPORT_MESSAGES.NOT_CANCELLABLE);
    }

    await importBatchRepository.setStatus(id, IMPORT_BATCH_STATUS.CANCELLED);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: 'ImportBatch',
        entityId: id,
        action: 'CANCELLED',
        oldValues: { status: batch.status },
        newValues: { status: IMPORT_BATCH_STATUS.CANCELLED },
        reason: 'Import batch cancelled',
        performedBy: userId,
    });

    return await importBatchRepository.findById(id);
}
