import express from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllClasses)
  .post(protect, authorize('principal'), createClass);

router.route('/:id')
  .get(protect, getClassById)
  .put(protect, authorize('principal'), updateClass)
  .delete(protect, authorize('principal'), deleteClass);

export default router;
