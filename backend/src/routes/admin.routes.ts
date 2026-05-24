import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/admin.controller.js';

const router = Router();

// Message templates — any authenticated user can read; editors manage.
router.get('/templates', ctrl.listTemplates);
router.post('/templates', authorize('ADMIN', 'SALES', 'PROJECT_MANAGER'), ctrl.createTemplate);
router.delete('/templates/:id', authorize('ADMIN'), ctrl.deleteTemplate);

// Admin-only.
router.get('/audit-log', authorize('ADMIN'), ctrl.auditLog);
router.get('/trash', authorize('ADMIN'), ctrl.trash);
router.post('/trash/:type/:id/restore', authorize('ADMIN'), ctrl.restore);
router.get('/backup', authorize('ADMIN'), ctrl.exportData);

export default router;
