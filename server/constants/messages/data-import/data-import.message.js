export const DATA_IMPORT_MESSAGES = {
    CREATED: 'Import batch created. Review the parsed rows before confirming.',
    FETCHED: 'Import batch retrieved successfully.',
    FETCHED_ALL: 'Import batches retrieved successfully.',
    ROWS_FETCHED: 'Import batch rows retrieved successfully.',
    CONFIRMED: 'Import confirmed. Valid rows have been imported.',
    CANCELLED: 'Import batch cancelled.',
    TARGET_TYPES_FETCHED: 'Supported import types retrieved successfully.',

    NOT_FOUND: 'Import batch not found.',
    DOCUMENT_NOT_FOUND: 'The referenced document was not found.',
    DOCUMENT_NOT_A_DATA_DOCUMENT: 'Only spreadsheet documents (xlsx, xls, csv) can be used for a structured import.',
    UNSUPPORTED_SPREADSHEET_FORMAT: 'Legacy .xls files are not supported yet — please save the file as .xlsx or .csv and upload it again.',
    UNSUPPORTED_TARGET_TYPE: 'This import type is not supported.',
    EMPTY_SPREADSHEET: 'The spreadsheet has no data rows to import.',
    ALREADY_CONFIRMED: 'This import has already been confirmed.',
    NOT_READY_TO_CONFIRM: 'This import cannot be confirmed until validation has completed successfully.',
    NOT_CANCELLABLE: 'Only a batch that has not yet been confirmed can be cancelled.',
};
