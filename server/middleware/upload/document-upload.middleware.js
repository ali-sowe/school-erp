import fs from 'fs';
import path from 'path';
import multer from 'multer';
import env from '../../config/env.js';
import { AppError } from '../../helpers/app-error.helper.js';
import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { DOCUMENT_MESSAGES } from '../../constants/messages/document/document.message.js';
import { ALLOWED_DOCUMENT_EXTENSIONS } from '../../constants/document.constants.js';
import {
    getDocumentExtension,
    isAllowedExtension,
    generateStoredFilename,
} from '../../helpers/document/document.helper.js';

// One subfolder per school under the upload root, so files are already
// tenant-separated on disk (defense in depth on top of the school_id check
// every read goes through).
function resolveSchoolUploadDir(schoolId) {
    const dir = path.resolve(process.cwd(), env.uploads.dir, 'documents', String(schoolId));
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        try {
            callback(null, resolveSchoolUploadDir(req.user.schoolId));
        } catch (error) {
            callback(error);
        }
    },
    filename: (req, file, callback) => {
        const extension = getDocumentExtension(file.originalname);
        callback(null, generateStoredFilename(extension));
    },
});

function fileFilter(req, file, callback) {
    const extension = getDocumentExtension(file.originalname);

    if (!isAllowedExtension(extension)) {
        return callback(new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.FILE_TYPE_NOT_ALLOWED));
    }

    const allowedMimeTypes = ALLOWED_DOCUMENT_EXTENSIONS[extension].mimeTypes;
    if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.FILE_TYPE_NOT_ALLOWED));
    }

    callback(null, true);
}

function buildUploader() {
    return multer({
        storage,
        fileFilter,
        limits: { fileSize: env.uploads.maxFileSizeMb * 1024 * 1024 },
    });
}

// Wraps multer so its errors (missing file, oversized file, rejected type)
// come out as the same AppError shape every other module's errors do,
// rather than a raw MulterError reaching error-handler.js.
export const uploadDocumentFile = (req, res, next) => {
    buildUploader().single('file')(req, res, (error) => {
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return next(new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.FILE_TOO_LARGE));
        }

        if (error) {
            return next(error);
        }

        if (!req.file) {
            return next(new AppError(HTTP_STATUS.BAD_REQUEST, DOCUMENT_MESSAGES.FILE_REQUIRED));
        }

        next();
    });
};
