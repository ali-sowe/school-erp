import test from 'node:test';
import assert from 'node:assert/strict';
import * as feeStructureService from '../services/finance/fee-structure.service.js';
import * as invoiceService from '../services/finance/invoice.service.js';
import * as paymentService from '../services/finance/payment.service.js';

const serviceFunctionsToCheck = [
    [feeStructureService, 'createFeeStructure', [{ academic_year_id: 1, name: 'Tuition', amount: 5000 }, 1, 1]],
    [feeStructureService, 'getFeeStructures', [1, {}]],
    [invoiceService, 'createInvoice', [{ student_id: 1, academic_year_id: 1, description: 'Tuition', amount_due: 5000 }, 1, 1]],
    [invoiceService, 'bulkGenerateInvoices', [1, 1, 1, 1]],
    [invoiceService, 'getInvoices', [1, {}]],
    [invoiceService, 'getFeeCollectionSummary', [1, 1]],
    [invoiceService, 'requestInvoiceVoid', [1, 'Duplicate invoice raised in error', 1, 1]],
    [paymentService, 'recordPayment', [1, { amount: 1000, payment_method: 'CASH', payment_date: '2026-01-10' }, 1, 1]],
    [paymentService, 'getPaymentsForInvoice', [1, 1]],
    [paymentService, 'voidPaymentById', [1, 'Recorded in error', 1, 1]],
    [paymentService, 'requestPaymentVoid', [1, 'Recorded in error', 1, 1]]
];

test('finance module services export the expected functions', () => {
    for (const [serviceModule, functionName] of serviceFunctionsToCheck) {
        assert.equal(typeof serviceModule[functionName], 'function', `${functionName} should be an exported function`);
    }
});

// A missing DB connection (ECONNREFUSED) is expected in environments without
// MySQL running and is not what this test is checking for. A ReferenceError
// means a broken/missing import — that's the real bug class this guards
// against (see: teacher-module.wiring.test.js).
test('finance module services do not throw a ReferenceError (imports are wired correctly)', async () => {
    for (const [serviceModule, functionName, args] of serviceFunctionsToCheck) {
        try {
            await serviceModule[functionName](...args);
        } catch (error) {
            assert.notEqual(
                error.constructor.name,
                'ReferenceError',
                `${functionName} threw a ReferenceError, likely a missing import: ${error.message}`
            );
        }
    }
});
