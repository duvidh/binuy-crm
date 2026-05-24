import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/task.controller.js';

const router = Router();
const EDITORS = ['ADMIN', 'SALES', 'PROJECT_MANAGER', 'ACCOUNTANT'];

router.get('/', ctrl.list);
router.post('/', authorize(...EDITORS), ctrl.create);
router.patch('/:id', authorize(...EDITORS), ctrl.update);
router.patch('/:id/toggle', authorize(...EDITORS), ctrl.toggleComplete);
router.delete('/:id', authorize(...EDITORS), ctrl.remove);

export default router;
