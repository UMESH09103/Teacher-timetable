import express from 'express';
import {
  getMyCategoryStrength,
  updateMyCategoryStrength,
  getAllCategoryStrength,
  updateAdminCategoryStrength
} from '../controllers/categoryStrengthController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/my-class', getMyCategoryStrength);
router.post('/my-class', updateMyCategoryStrength);

router.get('/all', authorize('principal'), getAllCategoryStrength);
router.post('/admin-update', authorize('principal'), updateAdminCategoryStrength);

export default router;
