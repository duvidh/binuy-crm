import { Router } from 'express';
import { authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import * as ctrl from '../controllers/project.controller.js';
import * as sub from '../controllers/projectSub.controller.js';

const router = Router();
const EDITORS = ['ADMIN', 'PROJECT_MANAGER', 'SALES'];

router.get('/checklist-templates', sub.listChecklistTemplates);
router.get('/', ctrl.list);
router.get('/kanban', ctrl.kanban);
router.get('/:id', ctrl.getOne);
router.get('/:id/profitability', ctrl.profitability);

router.post('/', authorize(...EDITORS), ctrl.create);
router.patch('/:id', authorize(...EDITORS), ctrl.update);
router.delete('/:id', authorize('ADMIN', 'PROJECT_MANAGER'), ctrl.remove);

// Milestones
router.post('/:id/milestones', authorize(...EDITORS), sub.createMilestone);
router.patch('/:id/milestones/:milestoneId', authorize(...EDITORS), sub.updateMilestone);
router.delete('/:id/milestones/:milestoneId', authorize(...EDITORS), sub.deleteMilestone);

// Permits
router.post('/:id/permits', authorize(...EDITORS), sub.createPermit);
router.patch('/:id/permits/:permitId', authorize(...EDITORS), sub.updatePermit);
router.delete('/:id/permits/:permitId', authorize(...EDITORS), sub.deletePermit);

// Checklists
router.post('/:id/checklists', authorize(...EDITORS), sub.createChecklist);
router.patch('/:id/checklist-items/:itemId', sub.toggleChecklistItem);
router.delete('/:id/checklists/:checklistId', authorize(...EDITORS), sub.deleteChecklist);

// Site log
router.post('/:id/site-log', authorize(...EDITORS), sub.createSiteLog);
router.delete('/:id/site-log/:logId', authorize(...EDITORS), sub.deleteSiteLog);

// Photos
router.post('/:id/photos', authorize(...EDITORS), upload.single('file'), sub.uploadPhoto);
router.delete('/:id/photos/:photoId', authorize(...EDITORS), sub.deletePhoto);

export default router;
