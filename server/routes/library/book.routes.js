import { Router } from 'express';
import * as bookController from '../../controllers/library/book.controller.js';
import * as copyController from '../../controllers/library/copy.controller.js';
import * as borrowController from '../../controllers/library/borrow.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createBookSchema, updateBookSchema } from '../../validations/library/book.validation.js';
import { addCopiesSchema } from '../../validations/library/copy.validation.js';
import { borrowBookSchema } from '../../validations/library/borrow.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['library.write']), validate(createBookSchema), asyncHandler(bookController.createBook));
router.get('/', authenticate, authorize(['library.read']), asyncHandler(bookController.getBooks));
router.get('/:id', authenticate, authorize(['library.read']), asyncHandler(bookController.getBookById));
router.patch('/:id', authenticate, authorize(['library.write']), validate(updateBookSchema), asyncHandler(bookController.updateBook));
router.patch('/:id/archive', authenticate, authorize(['library.write']), asyncHandler(bookController.archiveBook));
router.patch('/:id/restore', authenticate, authorize(['library.write']), asyncHandler(bookController.restoreBook));

// Copies: always scoped to one book — same reasoning as attendance living
// under class.routes.js. Withdrawing/restoring a specific already-created
// copy by its own id is the exception (copy.routes.js), mirroring
// payment.routes.js's void-by-own-id pattern.
router.post('/:id/copies', authenticate, authorize(['library.write']), validate(addCopiesSchema), asyncHandler(copyController.addCopies));
router.get('/:id/copies', authenticate, authorize(['library.read']), asyncHandler(copyController.getCopiesForBook));

// Borrowing: issuing is always "a copy of this book", so it's nested here.
// Returning an already-issued copy is by the borrow record's own id
// (borrow.routes.js) since the caller no longer necessarily has the book_id
// at hand.
router.post('/:id/borrow', authenticate, authorize(['library.write']), validate(borrowBookSchema), asyncHandler(borrowController.borrowBook));

export default router;
