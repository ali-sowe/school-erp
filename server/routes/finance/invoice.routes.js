import { Router } from 'express';
import * as invoiceController from '../../controllers/finance/invoice.controller.js';
import * as paymentController from '../../controllers/finance/payment.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createInvoiceSchema, bulkGenerateInvoicesSchema, voidInvoiceSchema } from '../../validations/finance/invoice.validation.js';
import { recordPaymentSchema } from '../../validations/finance/payment.validation.js';

const router = Router();

// Placed before /:id so 'summary' and 'bulk-generate' are never swallowed
// by the :id param route below.
router.get('/summary', authenticate, authorize(['finance.read']), asyncHandler(invoiceController.getFeeCollectionSummary));
router.post('/bulk-generate', authenticate, authorize(['finance.write']), validate(bulkGenerateInvoicesSchema), asyncHandler(invoiceController.bulkGenerateInvoices));

router.post('/', authenticate, authorize(['finance.write']), validate(createInvoiceSchema), asyncHandler(invoiceController.createInvoice));
router.get('/', authenticate, authorize(['finance.read']), asyncHandler(invoiceController.getInvoices));
router.get('/:id', authenticate, authorize(['finance.read']), asyncHandler(invoiceController.getInvoiceById));
router.patch('/:id/void', authenticate, authorize(['finance.write']), validate(voidInvoiceSchema), asyncHandler(invoiceController.voidInvoice));
router.post('/:id/void-request', authenticate, authorize(['finance.write']), validate(voidInvoiceSchema), asyncHandler(invoiceController.requestVoidInvoice));

// Payments always target one invoice, so recording/listing them lives here
// — same reasoning as attendance/subject-teachers living under
// class.routes.js. Voiding an already-recorded payment by its own id is the
// exception (payment.routes.js), matching teacher-subject-assignments'
// end-by-own-id pattern.
router.post('/:id/payments', authenticate, authorize(['finance.write']), validate(recordPaymentSchema), asyncHandler(paymentController.recordPayment));
router.get('/:id/payments', authenticate, authorize(['finance.read']), asyncHandler(paymentController.getPaymentsForInvoice));

export default router;
