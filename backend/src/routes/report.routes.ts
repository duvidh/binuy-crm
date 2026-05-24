import { Router } from 'express';
import * as ctrl from '../controllers/report.controller.js';

const router = Router();

router.get('/sales', ctrl.sales);
router.get('/lead-sources', ctrl.leadSources);
router.get('/profitability', ctrl.profitabilityReport);
router.get('/sales-by-rep', ctrl.salesByRep);

export default router;
