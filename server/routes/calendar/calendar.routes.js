import { Router } from 'express';
import * as calendarController from '../../controllers/calendar/calendar.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createCalendarEventSchema, updateCalendarEventSchema, copyEventsToYearSchema } from '../../validations/calendar/calendar.validation.js';

const router = Router();

// Registered before '/:id' for the same reason document.routes.js and
// import-batch.routes.js order their own fixed segments first — otherwise
// Express would try to match "copy" as an :id.
router.post('/copy', authenticate, authorize(['calendar.write']), validate(copyEventsToYearSchema), asyncHandler(calendarController.copyEventsToYear));

router.post('/', authenticate, authorize(['calendar.write']), validate(createCalendarEventSchema), asyncHandler(calendarController.createEvent));
router.get('/', authenticate, authorize(['calendar.read']), asyncHandler(calendarController.getEvents));
router.get('/:id', authenticate, authorize(['calendar.read']), asyncHandler(calendarController.getEventById));
router.patch('/:id', authenticate, authorize(['calendar.write']), validate(updateCalendarEventSchema), asyncHandler(calendarController.updateEvent));
router.patch('/:id/archive', authenticate, authorize(['calendar.write']), asyncHandler(calendarController.archiveEvent));
router.patch('/:id/restore', authenticate, authorize(['calendar.write']), asyncHandler(calendarController.restoreEvent));

export default router;
