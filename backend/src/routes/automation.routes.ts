import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/automation.controller.js';

const router = Router();

router.get('/', ctrl.list);
router.post('/', authorize('ADMIN'), ctrl.create);
router.patch('/:id', authorize('ADMIN'), ctrl.update);
router.delete('/:id', authorize('ADMIN'), ctrl.remove);

export default router;
