import express from 'express';
import {
  getTimetable,
  getTodayTimetable,
  getLiveTimetable,
  getWeeklyTimetable,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry
} from '../controllers/timetableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getTimetable);
router.get('/today', protect, getTodayTimetable);
router.get('/live', protect, getLiveTimetable);
router.get('/weekly', protect, getWeeklyTimetable);

router.post('/', protect, authorize('principal'), createTimetableEntry);
router.put('/:id', protect, authorize('principal'), updateTimetableEntry);
router.delete('/:id', protect, authorize('principal'), deleteTimetableEntry);

export default router;
