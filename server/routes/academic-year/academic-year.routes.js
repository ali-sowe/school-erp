import { Router } from 'express';
import * as academicYearController from '../../controllers/academic-year/academic-year.controller.js';

const router = Router();

router.post('/', academicYearController.createAcademicYear);
router.get('/', academicYearController.getAcademicYears);
router.get('/:id', academicYearController.getAcademicYearById);
router.patch('/:id', academicYearController.updateAcademicYear);
router.patch('/:id/activate', academicYearController.activateAcademicYear);
router.patch('/:id/close', academicYearController.closeAcademicYear);

export default router;