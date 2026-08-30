import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { DOCUMENT_MESSAGES } from '../../constants/messages/document/document.message.js';
import { ALLOWED_DOCUMENT_EXTENSIONS } from '../../constants/document.constants.js';
import { AppError } from '../app-error.helper.js';
import * as documentRepository from '../../repositories/document/document.repository.js';

// Same tenant-ownership pattern used throughout (book.helper.js,
// student.helper.js, etc).
export async function findOwnedDocumentOrThrow(documentId, schoolId) {
    const document = await documentRepository.findById(documentId);

    if (!document || document.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, DOCUMENT_MESSAGES.NOT_FOUND);
    }

    return document;
}

// Extension is taken from the original filename, never trusted from the
// client's declared mime type alone — mime types are easy to spoof, but an
// extension + whitelist + declared-mime-type cross-check (used together in
// the upload middleware) is enough for this being a school-internal tool,
// not a public upload surface.
export function getDocumentExtension(originalFilename) {
    return path.extname(originalFilename).replace('.', '').toLowerCase();
}

export function isAllowedExtension(extension) {
    return Object.prototype.hasOwnProperty.call(ALLOWED_DOCUMENT_EXTENSIONS, extension);
}

export function deriveDocumentKind(extension) {
    return ALLOWED_DOCUMENT_EXTENSIONS[extension]?.kind ?? null;
}

// uuid + original extension — never the user-supplied filename — so two
// uploads named "report.pdf" never collide on disk and a crafted filename
// can't traverse out of the upload directory.
export function generateStoredFilename(extension) {
    return `${uuidv4()}.${extension}`;
}
