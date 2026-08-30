import { Router } from 'express';
import * as examController from '../../controllers/exam/exam.controller.js';
import * as examResultController from '../../controllers/exam/exam-result.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createExamSchema, updateExamSchema, reopenExamSchema, addExamSubjectSchema } from '../../validations/exam/exam.validation.js';
import { recordResultsSchema } from '../../validations/exam/exam-result.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['exams.write']), validate(createExamSchema), asyncHandler(examController.createExam));
router.get('/', authenticate, authorize(['exams.read']), asyncHandler(examController.getExams));
router.get('/:id', authenticate, authorize(['exams.read']), asyncHandler(examController.getExamById));
router.patch('/:id', authenticate, authorize(['exams.write']), validate(updateExamSchema), asyncHandler(examController.updateExam));

// Lifecycle: SCHEDULED -> ONGOING -> COMPLETED, with an authorized,
// audited override to reopen (Calendar Engine doc's plans-vs-reality pattern).
router.patch('/:id/start', authenticate, authorize(['exams.write']), asyncHandler(examController.startExam));
router.patch('/:id/complete', authenticate, authorize(['exams.write']), asyncHandler(examController.completeExam));
router.patch('/:id/reopen', authenticate, authorize(['exams.write']), validate(reopenExamSchema), asyncHandler(examController.reopenExam));

// Curriculum for this exam — which of the class's subjects are examined and
// out of how much. Locked once the exam starts (exam.service.js).
router.get('/:id/subjects', authenticate, authorize(['exams.read']), asyncHandler(examController.getExamSubjects));
router.post('/:id/subjects', authenticate, authorize(['exams.write']), validate(addExamSubjectSchema), asyncHandler(examController.addExamSubject));
router.delete('/:id/subjects/:subjectId', authenticate, authorize(['exams.write']), asyncHandler(examController.removeExamSubject));

// Results always target one exam, so bulk recording/listing lives here —
// same reasoning as attendance living under class.routes.js. Correcting a
// single already-recorded result by its own id is the exception
// (exam-result.routes.js), matching attendance's own pattern.
router.post('/:id/results', authenticate, authorize(['exams.write']), validate(recordResultsSchema), asyncHandler(examResultController.recordResults));
router.get('/:id/results', authenticate, authorize(['exams.read']), asyncHandler(examResultController.getResultsForExam));
router.get('/:id/summary', authenticate, authorize(['exams.read']), asyncHandler(examResultController.getExamSummary));

export default router;
