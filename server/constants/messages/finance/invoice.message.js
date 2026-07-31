export const INVOICE_MESSAGES = {
    CREATED: 'Invoice created successfully.',
    BULK_CREATED: 'Invoices generated successfully.',
    VOIDED: 'Invoice voided successfully.',
    VOID_REQUESTED: 'Void request submitted for approval.',
    FETCHED: 'Invoice retrieved successfully.',
    FETCHED_ALL: 'Invoices retrieved successfully.',
    SUMMARY_FETCHED: 'Fee collection summary retrieved successfully.',

    NOT_FOUND: 'Invoice not found.',
    STUDENT_NOT_FOUND: 'The specified student does not exist.',
    ACADEMIC_YEAR_NOT_FOUND: 'The specified academic year does not exist.',
    TERM_NOT_FOUND: 'The specified term does not exist.',
    FEE_STRUCTURE_NOT_FOUND: 'The specified fee structure does not exist.',
    CLASS_NOT_FOUND: 'The specified class does not exist.',
    INVALID_AMOUNT: 'Amount due must be greater than zero.',
    DESCRIPTION_REQUIRED: 'A description is required when not generating the invoice from a fee structure.',
    ALREADY_VOIDED: 'This invoice has already been voided.',
    CANNOT_VOID_WITH_PAYMENTS: 'This invoice has payments recorded against it. Void those payments first.',
    VOID_REASON_REQUIRED: 'A reason is required to void an invoice.'
};
