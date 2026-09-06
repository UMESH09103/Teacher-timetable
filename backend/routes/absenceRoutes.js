import express from 'express';
import {
  getAllAbsences,
  createAbsence,
  deleteAbsence
} from '../controllers/absenceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllAbsences)
  .post(protect, authorize('principal'), createAbsence);

router.route('/:id')
  .delete(protect, authorize('principal'), deleteAbsence);

export default router;
