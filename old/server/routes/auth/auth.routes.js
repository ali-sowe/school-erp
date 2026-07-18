import { Router } from 'express';
import { login, logout, me } from '../../controllers/auth/auth.controller.js';
import { asyncHandler } from '../../helpers/async-handler.helper.js';
import { authenticate } from '../../middleware/auth/auth.middleware.js';

const router = Router();

router.post('/login', asyncHandler(login));
router.get('/me', authenticate, asyncHandler(me));
router.post('/logout', authenticate, asyncHandler(logout));

export default router;