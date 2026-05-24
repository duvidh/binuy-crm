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
import projectRoutes from './project.routes.js';
import financeRoutes from './finance.routes.js';
import taskRoutes from './task.routes.js';
import notificationRoutes from './notification.routes.js';
import automationRoutes from './automation.routes.js';
import reportRoutes from './report.routes.js';
import adminRoutes from './admin.routes.js';

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
router.use('/projects', authenticate, projectRoutes);
router.use('/finance', authenticate, financeRoutes);
router.use('/tasks', authenticate, taskRoutes);
router.use('/notifications', authenticate, notificationRoutes);
router.use('/automations', authenticate, automationRoutes);
router.use('/reports', authenticate, reportRoutes);
router.use('/admin', authenticate, adminRoutes);

export default router;
