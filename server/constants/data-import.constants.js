// A batch moves PENDING_VALIDATION -> VALIDATED|FAILED_VALIDATION ->
// (confirmed) -> IMPORTED|PARTIALLY_IMPORTED, or CANCELLED at any point
// before confirmation. "Validated" means the check finished, not that
// every row passed — invalid rows just stay out of the confirm step.
export const IMPORT_BATCH_STATUS = {
    PENDING_VALIDATION: 'PENDING_VALIDATION',
    VALIDATED: 'VALIDATED',
    FAILED_VALIDATION: 'FAILED_VALIDATION',
    IMPORTED: 'IMPORTED',
    PARTIALLY_IMPORTED: 'PARTIALLY_IMPORTED',
    CANCELLED: 'CANCELLED',
};

export const IMPORT_ROW_STATUS = {
    PENDING: 'PENDING',
    VALID: 'VALID',
    INVALID: 'INVALID',
    IMPORTED: 'IMPORTED',
    FAILED: 'FAILED',
};
