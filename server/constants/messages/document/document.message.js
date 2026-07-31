export const DOCUMENT_MESSAGES = {
    UPLOADED: 'Document uploaded successfully.',
    UPDATED: 'Document updated successfully.',
    FETCHED: 'Document retrieved successfully.',
    FETCHED_ALL: 'Documents retrieved successfully.',
    ARCHIVED: 'Document archived successfully.',
    RESTORED: 'Document restored successfully.',

    NOT_FOUND: 'Document not found.',
    ALREADY_ARCHIVED: 'This document has already been archived.',
    ALREADY_ACTIVE: 'This document is already active.',
    CANNOT_EDIT_ARCHIVED: 'An archived document cannot be modified. Restore it first.',
    FILE_REQUIRED: 'A file is required.',
    FILE_TYPE_NOT_ALLOWED: 'This file type is not supported.',
    FILE_TOO_LARGE: 'This file exceeds the maximum upload size.',
    FILE_MISSING_ON_DISK: 'The stored file could not be found. It may have been moved or deleted outside the system.',

    PROCESSING_TRIGGERED: 'Document processing has been triggered.',
    REPROCESS_NOT_ALLOWED: 'Only a document with failed processing can be reprocessed.',
    PREVIEW_NOT_AVAILABLE: 'A preview is not available for this document.',
    PREVIEW_NOT_READY: 'The preview for this document has not finished generating yet.',
    SEARCH_QUERY_REQUIRED: 'A search query is required.',
    SEARCHED: 'Search results retrieved successfully.',
};
