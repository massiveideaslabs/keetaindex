import { Router } from 'express';
import {
  getApps,
  addApp,
  updateApp,
  deleteApp,
  incrementAppClicks
} from '../controllers/appsController.js';

const router = Router();

router.get('/', getApps);
router.post('/', addApp);
router.put('/:id', updateApp);
router.delete('/:id', deleteApp);
router.patch('/:id/clicks', incrementAppClicks);

export default router;

