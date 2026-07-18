import { Router } from 'express';
import * as roleController from '../../controllers/role/role.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['roles.write']), asyncHandler(roleController.createRole));
router.get('/', authenticate, authorize(['roles.read']), asyncHandler(roleController.getRoles));
router.get('/:id', authenticate, authorize(['roles.read']), asyncHandler(roleController.getRoleById));
router.patch('/:id', authenticate, authorize(['roles.write']), asyncHandler(roleController.updateRole));
router.delete('/:id', authenticate, authorize(['roles.write']), asyncHandler(roleController.deleteRole));

export default router;
