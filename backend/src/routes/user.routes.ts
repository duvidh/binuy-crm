import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/user.controller.js';

const router = Router();

// Any authenticated user can read the user list (for assignment dropdowns).
router.get('/', ctrl.list);
router.post('/', authorize('ADMIN'), ctrl.create);
router.patch('/:id', authorize('ADMIN'), ctrl.update);

export default router;
