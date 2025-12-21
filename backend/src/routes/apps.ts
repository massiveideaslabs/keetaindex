import { Router } from 'express';
import {
  getApps,
  getAllApps,
  addApp,
  updateApp,
  deleteApp,
  incrementAppClicks,
  approveApp
} from '../controllers/appsController.js';

const router = Router();

router.get('/', getApps); // Public: only approved apps
router.get('/all', getAllApps); // Admin: all apps including unapproved
router.post('/', addApp);
router.put('/:id', updateApp);
router.delete('/:id', deleteApp);
router.patch('/:id/clicks', incrementAppClicks);
router.patch('/:id/approve', approveApp);

export default router;

