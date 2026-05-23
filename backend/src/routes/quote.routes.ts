import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/quote.controller.js';

const router = Router();

const EDITORS = ['ADMIN', 'SALES', 'PROJECT_MANAGER', 'ACCOUNTANT'];

router.get('/catalog', ctrl.listCatalog);
router.post('/catalog', authorize(...EDITORS), ctrl.createCatalogItem);
router.delete('/catalog/:id', authorize(...EDITORS), ctrl.deleteCatalogItem);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', authorize(...EDITORS), ctrl.create);
router.post('/:id/duplicate', authorize(...EDITORS), ctrl.duplicate);
router.post('/:id/send', authorize(...EDITORS), ctrl.send);
router.patch('/:id', authorize(...EDITORS), ctrl.update);
router.delete('/:id', authorize('ADMIN', 'SALES'), ctrl.remove);

export default router;
