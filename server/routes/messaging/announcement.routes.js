import { Router } from 'express';
import * as announcementController from '../../controllers/messaging/announcement.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';
import { validate } from '../../middleware/validation/validate.middleware.js';
import { createAnnouncementSchema, updateAnnouncementSchema } from '../../validations/messaging/announcement.validation.js';

const router = Router();

router.post('/', authenticate, authorize(['announcements.write']), validate(createAnnouncementSchema), asyncHandler(announcementController.createAnnouncement));
router.get('/', authenticate, authorize(['announcements.read']), asyncHandler(announcementController.getAnnouncements));
router.get('/:id', authenticate, authorize(['announcements.read']), asyncHandler(announcementController.getAnnouncementById));
router.patch('/:id', authenticate, authorize(['announcements.write']), validate(updateAnnouncementSchema), asyncHandler(announcementController.updateAnnouncement));
router.patch('/:id/archive', authenticate, authorize(['announcements.write']), asyncHandler(announcementController.archiveAnnouncement));
router.patch('/:id/restore', authenticate, authorize(['announcements.write']), asyncHandler(announcementController.restoreAnnouncement));

router.patch('/:id/read', authenticate, authorize(['announcements.read']), asyncHandler(announcementController.markAsRead));
router.get('/:id/readers', authenticate, authorize(['announcements.write']), asyncHandler(announcementController.getReaders));
router.get('/:id/recipients', authenticate, authorize(['announcements.write']), asyncHandler(announcementController.getRecipients));

export default router;
