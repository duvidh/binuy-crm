import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/auth.controller.js';

const router = Router();

// Tight rate limit on auth endpoints to slow brute force.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי נסיונות. נסה שוב מאוחר יותר' },
});

router.post('/login', authLimiter, ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', authenticate, ctrl.me);
// Only admins can create users in the running system.
router.post('/register', authenticate, authorize('ADMIN'), ctrl.register);

export default router;
