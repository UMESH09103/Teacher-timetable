import express from 'express';
import {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher
} from '../controllers/teacherController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(protect, getAllTeachers)
  .post(protect, authorize('principal'), createTeacher);

router.route('/:id')
  .get(protect, getTeacherById)
  .put(protect, authorize('principal'), updateTeacher)
  .delete(protect, authorize('principal'), deleteTeacher);

export default router;
