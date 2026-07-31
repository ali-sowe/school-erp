export const PAYMENT_MESSAGES = {
    RECORDED: 'Payment recorded successfully.',
    VOIDED: 'Payment voided successfully.',
    VOID_REQUESTED: 'Void request submitted for approval.',
    FETCHED: 'Payment retrieved successfully.',
    FETCHED_ALL: 'Payments retrieved successfully.',

    NOT_FOUND: 'Payment not found.',
    INVOICE_NOT_FOUND: 'The specified invoice does not exist.',
    INVOICE_VOIDED: 'Cannot record a payment against a voided invoice.',
    INVALID_AMOUNT: 'Payment amount must be greater than zero.',
    EXCEEDS_BALANCE: 'Payment amount exceeds the invoice\'s remaining balance.',
    ALREADY_VOIDED: 'This payment has already been voided.',
    VOID_REASON_REQUIRED: 'A reason is required to void a payment.'
};
