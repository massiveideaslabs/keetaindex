import { Router } from 'express';
import {
  getReports,
  addReport,
  deleteReport,
  deleteReportsForApp
} from '../controllers/reportsController.js';

const router = Router();

router.get('/', getReports);
router.post('/', addReport);
router.delete('/:id', deleteReport);
router.delete('/app/:appId', deleteReportsForApp);

export default router;

