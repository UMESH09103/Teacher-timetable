import express from 'express';
import {
  checkAttendance,
  submitAttendance,
  getAttendanceHistory,
  getClassWiseSummary,
  getAttendanceStats
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/check', checkAttendance);
router.post('/', submitAttendance);
router.get('/history', getAttendanceHistory);
router.get('/class-summary', authorize('principal'), getClassWiseSummary);
router.get('/stats', getAttendanceStats);

export default router;
