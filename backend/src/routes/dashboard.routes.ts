import { Router } from 'express';
import * as ctrl from '../controllers/dashboard.controller.js';

const router = Router();

router.get('/stats', ctrl.stats);
router.get('/revenue', ctrl.revenue);
router.get('/layout', ctrl.getLayout);
router.put('/layout', ctrl.saveLayout);

export default router;
