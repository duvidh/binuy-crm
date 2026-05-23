import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/settings.controller.js';

const router = Router();

// Reading lists/settings is allowed for any authenticated user.
router.get('/lists', ctrl.getLists);
router.get('/company', ctrl.getCompany);
router.get('/pipeline-stages', ctrl.getPipelineStages);

// Mutations require ADMIN.
router.post('/lists', authorize('ADMIN'), ctrl.createListItem);
router.patch('/lists/reorder', authorize('ADMIN'), ctrl.reorderList);
router.patch('/lists/:id', authorize('ADMIN'), ctrl.updateListItem);
router.delete('/lists/:id', authorize('ADMIN'), ctrl.deleteListItem);

router.put('/company', authorize('ADMIN'), ctrl.updateCompany);

router.post('/pipeline-stages', authorize('ADMIN'), ctrl.createStage);
router.patch('/pipeline-stages/:id', authorize('ADMIN'), ctrl.updateStage);
router.delete('/pipeline-stages/:id', authorize('ADMIN'), ctrl.deleteStage);

export default router;
