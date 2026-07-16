import { Router } from 'express';
import * as academicYearController from '../../controllers/academic-year/academic-year.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';

const router = Router();

router.post('/', authenticate, asyncHandler(academicYearController.createAcademicYear));
router.get('/', authenticate, asyncHandler(academicYearController.getAcademicYears));
router.get('/:id', authenticate, asyncHandler(academicYearController.getAcademicYearById));
router.patch('/:id', authenticate, asyncHandler(academicYearController.updateAcademicYear));
router.patch('/:id/activate', authenticate, asyncHandler(academicYearController.activateAcademicYear));
router.patch('/:id/complete', authenticate, asyncHandler(academicYearController.completeAcademicYear));

export default router;