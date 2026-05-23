import { Router } from 'express';
import * as ctrl from '../controllers/tag.controller.js';

const router = Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.post('/attach', ctrl.attach);
router.post('/detach', ctrl.detach);
router.delete('/:id', ctrl.remove);

export default router;
