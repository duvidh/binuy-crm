import { Router } from 'express';
import * as ctrl from '../controllers/public.controller.js';

const router = Router();

router.get('/quotes/:token', ctrl.getQuoteByToken);
router.post('/quotes/:token/sign', ctrl.signQuote);

export default router;
