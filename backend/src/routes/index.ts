import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import contactRoutes from './contact.routes.js';
import settingsRoutes from './settings.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import quoteRoutes from './quote.routes.js';
import publicRoutes from './public.routes.js';
import userRoutes from './user.routes.js';
import tagRoutes from './tag.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/public', publicRoutes);

// Everything below requires a valid access token.
router.use('/contacts', authenticate, contactRoutes);
router.use('/settings', authenticate, settingsRoutes);
router.use('/dashboard', authenticate, dashboardRoutes);
router.use('/quotes', authenticate, quoteRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/tags', authenticate, tagRoutes);

export default router;
