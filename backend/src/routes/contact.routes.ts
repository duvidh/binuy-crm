import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import * as ctrl from '../controllers/contact.controller.js';
import * as comments from '../controllers/comment.controller.js';

const router = Router();

const NO_VIEWER = ['ADMIN', 'SALES', 'PROJECT_MANAGER', 'ACCOUNTANT'];

router.get('/', ctrl.list);
router.get('/kanban', ctrl.kanban);
router.get('/pipeline', ctrl.pipelineBoard);
router.get('/export', ctrl.exportCsv);
router.get('/comments', comments.listComments);
router.get('/:id', ctrl.getOne);
router.get('/:id/activity', ctrl.activity);

router.post('/', authorize(...NO_VIEWER), ctrl.create);
router.post('/import', authorize(...NO_VIEWER), ctrl.importContacts);
router.post('/bulk', authorize(...NO_VIEWER), ctrl.bulk);
router.post('/comments', comments.createComment);
router.post('/:id/convert', authorize(...NO_VIEWER), ctrl.convert);
router.post('/:id/pipeline-stage', authorize(...NO_VIEWER), ctrl.moveStage);
router.post('/:id/portal-token', authorize(...NO_VIEWER), ctrl.portalToken);

router.patch('/:id', authorize(...NO_VIEWER), ctrl.update);
router.delete('/:id', authorize('ADMIN', 'SALES', 'PROJECT_MANAGER'), ctrl.remove);
router.delete('/comments/:id', comments.deleteComment);

export default router;
