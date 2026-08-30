import { Router } from 'express';
import * as reportController from '../../controllers/report/report.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

const router = Router();

router.get('/', authenticate, authorize(['reports.read']), asyncHandler(reportController.getAvailableReports));
router.get('/:key/download', authenticate, authorize(['reports.read']), asyncHandler(reportController.downloadReport));

export default router;
