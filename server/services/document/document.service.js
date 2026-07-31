import fs from 'fs';
import path from 'path';
import env from '../../config/env.js';
import { findOwnedDocumentOrThrow, getDocumentExtension, deriveDocumentKind } from '../../helpers/document/document.helper.js';
import * as documentRepository from '../../repositories/document/document.repository.js';
import { processReadableDocument } from './document-processing.service.js';
import { AppError } from '../../helpers/app-error.helper.js';
import { DOCUMENT_MESSAGES } from '../../constants/messages/document/document.message.js';
import { DOCUMENT_STATUS, DOCUMENT_KIND, PREVIEW_STATUS, TEXT_EXTRACTION_STATUS } from '../../constants/document.constants.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import * as auditRepository from '../../repositories/audit/audit.repository.js';
import { getChangedFields } from '../../helpers/audit/audit.helper.js';

// storage_path is kept relative to the upload root (not an absolute path)
// so the upload root can move between environments (dev machine vs server)
// without a data migration — resolveAbsolutePath is the one place that
// turns it back into a real path.
function resolveAbsolutePath(storagePath) {
    return path.resolve(process.cwd(), env.uploads.dir, storagePath);
}

export async function uploadDocument(file, metadata, schoolId, userId = null) {
    const extension = getDocumentExtension(file.originalname);
    const relativeStoragePath = path.join('documents', String(schoolId), file.filename);

    try {
        const id = await documentRepository.create(
            {
                school_id: schoolId,
                kind: deriveDocumentKind(extension),
                category: metadata.category,
                title: metadata.title,
                description: metadata.description,
                related_entity_type: metadata.related_entity_type,
                related_entity_id: metadata.related_entity_id,
                original_filename: file.originalname,
                stored_filename: file.filename,
                storage_path: relativeStoragePath,
                file_extension: extension,
                mime_type: file.mimetype,
                file_size_bytes: file.size,
            },
            userId
        );

        const document = await documentRepository.findById(id);

        await auditRepository.createAuditLog({
            schoolId,
            entityType: 'Document',
            entityId: id,
            action: 'UPLOADED',
            oldValues: null,
            newValues: { title: document.title, original_filename: document.original_filename },
            reason: 'Document uploaded',
            performedBy: userId,
        });

        // Fire-and-forget: extraction/preview can take a few seconds and
        // the upload response shouldn't wait on it. No job queue exists in
        // this stack yet, so this is an in-process background task — fine
        // at this scale (single server), see document-processing.service.js.
        if (document.kind === DOCUMENT_KIND.READABLE) {
            processReadableDocument(id).catch((error) => {
                console.error(`Background processing failed for document ${id}:`, error);
            });
        }

        return document;
    } catch (error) {
        // The file already landed on disk (multer runs before this). If the
        // DB write failed, don't leave an orphaned file with no record of it.
        fs.promises.unlink(file.path).catch(() => {});
        throw error;
    }
}

export async function getDocuments(schoolId, filters) {
    return await documentRepository.findAll(schoolId, filters);
}

export async function getDocumentById(id, schoolId) {
    return await findOwnedDocumentOrThrow(id, schoolId);
}

export async function getDownloadDetails(id, schoolId) {
    const document = await findOwnedDocumentOrThrow(id, schoolId);
    const absolutePath = resolveAbsolutePath(document.storage_path);

    if (!fs.existsSync(absolutePath)) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, DOCUMENT_MESSAGES.FILE_MISSING_ON_DISK);
    }

    return {
        absolutePath,
        originalFilename: document.original_filename,
        mimeType: document.mime_type,
    };
}

export async function getPreviewDetails(id, schoolId) {
    const document = await findOwnedDocumentOrThrow(id, schoolId);

    if (document.preview_status === PREVIEW_STATUS.NOT_APPLICABLE || document.preview_status === PREVIEW_STATUS.FAILED) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, DOCUMENT_MESSAGES.PREVIEW_NOT_AVAILABLE);
    }

    if (document.preview_status !== PREVIEW_STATUS.READY) {
        throw new AppError(HTTP_STATUS.CONFLICT, DOCUMENT_MESSAGES.PREVIEW_NOT_READY);
    }

    const absolutePath = resolveAbsolutePath(document.preview_storage_path);

    if (!fs.existsSync(absolutePath)) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, DOCUMENT_MESSAGES.FILE_MISSING_ON_DISK);
    }

    return {
        absolutePath,
        originalFilename: `${path.parse(document.original_filename).name}.pdf`,
    };
}

// Only offered for documents whose last processing attempt failed — a
// READY document doesn't need it, and a still-PENDING/GENERATING one is
// already in flight (avoids stacking duplicate background jobs on it).
export async function reprocessDocument(id, schoolId) {
    const document = await findOwnedDocumentOrThrow(id, schoolId);

    if (document.kind !== DOCUMENT_KIND.READABLE) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.REPROCESS_NOT_ALLOWED);
    }

    const hasFailure = document.preview_status === PREVIEW_STATUS.FAILED || document.text_extraction_status === TEXT_EXTRACTION_STATUS.FAILED;
    if (!hasFailure) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.REPROCESS_NOT_ALLOWED);
    }

    processReadableDocument(id).catch((error) => {
        console.error(`Background reprocessing failed for document ${id}:`, error);
    });

    return await documentRepository.findById(id);
}

export async function searchDocuments(schoolId, searchQuery, filters) {
    if (!searchQuery || !searchQuery.trim()) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.SEARCH_QUERY_REQUIRED);
    }

    return await documentRepository.searchDocuments(schoolId, searchQuery.trim(), filters);
}

export async function updateDocument(id, data, schoolId, userId = null) {
    const document = await findOwnedDocumentOrThrow(id, schoolId);

    if (document.status === DOCUMENT_STATUS.ARCHIVED) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.CANNOT_EDIT_ARCHIVED);
    }

    await documentRepository.update(id, data);

    const updatedDocument = await documentRepository.findById(id);
    const changes = getChangedFields(document, updatedDocument);

    if (Object.keys(changes.oldValues).length > 0) {
        await auditRepository.createAuditLog({
            schoolId,
            entityType: 'Document',
            entityId: id,
            action: 'UPDATED',
            oldValues: changes.oldValues,
            newValues: changes.newValues,
            reason: 'Document metadata updated',
            performedBy: userId,
        });
    }

    return updatedDocument;
}

export async function archiveDocument(id, schoolId, userId = null) {
    const document = await findOwnedDocumentOrThrow(id, schoolId);

    if (document.status === DOCUMENT_STATUS.ARCHIVED) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.ALREADY_ARCHIVED);
    }

    await documentRepository.setStatus(id, DOCUMENT_STATUS.ARCHIVED);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: 'Document',
        entityId: id,
        action: 'ARCHIVED',
        oldValues: { status: document.status },
        newValues: { status: DOCUMENT_STATUS.ARCHIVED },
        reason: 'Document archived',
        performedBy: userId,
    });

    return await documentRepository.findById(id);
}

export async function restoreDocument(id, schoolId, userId = null) {
    const document = await findOwnedDocumentOrThrow(id, schoolId);

    if (document.status === DOCUMENT_STATUS.ACTIVE) {
        throw new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.ALREADY_ACTIVE);
    }

    await documentRepository.setStatus(id, DOCUMENT_STATUS.ACTIVE);

    await auditRepository.createAuditLog({
        schoolId,
        entityType: 'Document',
        entityId: id,
        action: 'RESTORED',
        oldValues: { status: document.status },
        newValues: { status: DOCUMENT_STATUS.ACTIVE },
        reason: 'Document restored',
        performedBy: userId,
    });

    return await documentRepository.findById(id);
}
