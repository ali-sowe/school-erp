import { HTTP_STATUS } from '../../constants/httpStatus.js';
import { DATA_IMPORT_MESSAGES } from '../../constants/messages/data-import/data-import.message.js';
import { AppError } from '../app-error.helper.js';
import * as importBatchRepository from '../../repositories/data-import/import-batch.repository.js';

// Same tenant-ownership pattern used throughout (document.helper.js,
// book.helper.js, etc).
export async function findOwnedImportBatchOrThrow(importBatchId, schoolId) {
    const batch = await importBatchRepository.findById(importBatchId);

    if (!batch || batch.school_id !== schoolId) {
        throw new AppError(HTTP_STATUS.NOT_FOUND, DATA_IMPORT_MESSAGES.NOT_FOUND);
    }

    return batch;
}
