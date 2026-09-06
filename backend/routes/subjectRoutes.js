import express from 'express';
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject
} from '../controllers/subjectController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllSubjects)
  .post(protect, authorize('principal'), createSubject);

router.route('/:id')
  .put(protect, authorize('principal'), updateSubject)
  .delete(protect, authorize('principal'), deleteSubject);

export default router;
