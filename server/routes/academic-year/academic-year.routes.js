import { Router } from 'express';
import * as academicYearController from '../../controllers/academic-year/academic-year.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createAcademicYearSchema, updateAcademicYearSchema } from '../../validations/academic-year/academic-year.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['academic-years.write']), validate(createAcademicYearSchema), asyncHandler(academicYearController.createAcademicYear));
router.get('/', authenticate, authorize(['academic-years.read']), asyncHandler(academicYearController.getAcademicYears));
router.get('/:id', authenticate, authorize(['academic-years.read']), asyncHandler(academicYearController.getAcademicYearById));
router.patch('/:id', authenticate, authorize(['academic-years.write']), validate(updateAcademicYearSchema), asyncHandler(academicYearController.updateAcademicYear));
router.patch('/:id/activate', authenticate, authorize(['academic-years.write']), asyncHandler(academicYearController.activateAcademicYear));
router.patch('/:id/complete', authenticate, authorize(['academic-years.write']), asyncHandler(academicYearController.completeAcademicYear));

export default router;