import { Router } from 'express';
import * as userController from '../../controllers/user/user.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';
import { authorize } from '../../middleware/auth/authorize.middleware.js';

const router = Router();

router.post('/', authenticate, authorize(['users.write']), asyncHandler(userController.createUser));
router.get('/', authenticate, authorize(['users.read']), asyncHandler(userController.getUsers));
router.get('/:id', authenticate, authorize(['users.read']), asyncHandler(userController.getUserById));
router.patch('/:id', authenticate, authorize(['users.write']), asyncHandler(userController.updateUser));
router.delete('/:id', authenticate, authorize(['users.write']), asyncHandler(userController.deleteUser));

export default router;
