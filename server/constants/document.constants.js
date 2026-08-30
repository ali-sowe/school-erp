// Central whitelist for the document engine. Adding a new supported file
// type is a one-line change here — nothing else in the upload path needs
// to know about extensions.
//
// `kind` drives which future pipeline a file lands in: READABLE documents
// (letters, circulars, policies, certificates) get preview/text-extract/
// search on top of this later; DATA documents (spreadsheets) get the
// parse/validate/import pipeline. See ADR: Microsoft Office Document
// Processing.
export const DOCUMENT_KIND = {
    READABLE: 'READABLE',
    DATA: 'DATA',
};

export const DOCUMENT_STATUS = {
    ACTIVE: 'ACTIVE',
    ARCHIVED: 'ARCHIVED',
};

// Two independent pipelines, each with its own status: a file can have a
// ready preview but failed text extraction, or vice versa.
export const PREVIEW_STATUS = {
    PENDING: 'PENDING',
    NOT_APPLICABLE: 'NOT_APPLICABLE',
    GENERATING: 'GENERATING',
    READY: 'READY',
    FAILED: 'FAILED',
};

export const TEXT_EXTRACTION_STATUS = {
    PENDING: 'PENDING',
    NOT_APPLICABLE: 'NOT_APPLICABLE',
    EXTRACTING: 'EXTRACTING',
    READY: 'READY',
    FAILED: 'FAILED',
};

// A few starter categories for clients to offer as suggestions — category
// itself is a free string on the document (ADR-005: Configuration Over
// Hardcoding), so this list is not enforced server-side.
export const SUGGESTED_DOCUMENT_CATEGORIES = [
    'LETTER',
    'CIRCULAR',
    'POLICY',
    'MEETING_MINUTES',
    'CERTIFICATE',
    'DATA_IMPORT',
    'OTHER',
];

// extension (lowercase, no dot) -> { mimeTypes: [...accepted...], kind }
export const ALLOWED_DOCUMENT_EXTENSIONS = {
    pdf: { mimeTypes: ['application/pdf'], kind: DOCUMENT_KIND.READABLE },
    doc: { mimeTypes: ['application/msword'], kind: DOCUMENT_KIND.READABLE },
    docx: {
        mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        kind: DOCUMENT_KIND.READABLE,
    },
    ppt: { mimeTypes: ['application/vnd.ms-powerpoint'], kind: DOCUMENT_KIND.READABLE },
    pptx: {
        mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        kind: DOCUMENT_KIND.READABLE,
    },
    jpg: { mimeTypes: ['image/jpeg'], kind: DOCUMENT_KIND.READABLE },
    jpeg: { mimeTypes: ['image/jpeg'], kind: DOCUMENT_KIND.READABLE },
    png: { mimeTypes: ['image/png'], kind: DOCUMENT_KIND.READABLE },
    xls: { mimeTypes: ['application/vnd.ms-excel'], kind: DOCUMENT_KIND.DATA },
    xlsx: {
        mimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        kind: DOCUMENT_KIND.DATA,
    },
    csv: { mimeTypes: ['text/csv', 'application/vnd.ms-excel'], kind: DOCUMENT_KIND.DATA },
};
