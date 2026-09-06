import express from 'express';
import { getDashboardKpis, getAnalyticsReports } from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/kpis', protect, getDashboardKpis);
router.get('/analytics', protect, authorize('principal'), getAnalyticsReports);

export default router;
