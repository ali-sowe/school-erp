import { Router } from 'express';
import * as documentController from '../../controllers/document/document.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { uploadDocumentFile } from '../../middleware/upload/document-upload.middleware.js';
import { uploadDocumentSchema, updateDocumentSchema } from '../../validations/document/document.validation.js';

const router = Router();

// Upload order matters: authenticate first (multer's destination callback
// needs req.user.schoolId), then multer (populates req.body from the
// multipart form so validate has something to check), then validate.
router.post(
    '/',
    authenticate,
    authorize(['documents.write']),
    uploadDocumentFile,
    validate(uploadDocumentSchema),
    asyncHandler(documentController.uploadDocument)
);
router.get('/', authenticate, authorize(['documents.read']), asyncHandler(documentController.getDocuments));
// Registered before '/:id' — otherwise Express would match "search" as the
// :id param since it comes first in the route table.
router.get('/search', authenticate, authorize(['documents.read']), asyncHandler(documentController.searchDocuments));
router.get('/:id', authenticate, authorize(['documents.read']), asyncHandler(documentController.getDocumentById));
router.get('/:id/download', authenticate, authorize(['documents.read']), asyncHandler(documentController.downloadDocument));
router.get('/:id/preview', authenticate, authorize(['documents.read']), asyncHandler(documentController.previewDocument));
router.patch('/:id', authenticate, authorize(['documents.write']), validate(updateDocumentSchema), asyncHandler(documentController.updateDocument));
router.patch('/:id/archive', authenticate, authorize(['documents.write']), asyncHandler(documentController.archiveDocument));
router.patch('/:id/restore', authenticate, authorize(['documents.write']), asyncHandler(documentController.restoreDocument));
router.post('/:id/reprocess', authenticate, authorize(['documents.write']), asyncHandler(documentController.reprocessDocument));

export default router;
