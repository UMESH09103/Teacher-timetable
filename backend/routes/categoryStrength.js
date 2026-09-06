const express = require('express');
const router = express.Router();
const {
  getMyCategoryStrength,
  updateMyCategoryStrength,
  getAllCategoryStrength,
  updateAdminCategoryStrength
} = require('../controllers/categoryStrengthController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/my-class', authorize('teacher'), getMyCategoryStrength);
router.post('/my-class', authorize('teacher'), updateMyCategoryStrength);

router.get('/all', authorize('admin'), getAllCategoryStrength);
router.post('/admin-update', authorize('admin'), updateAdminCategoryStrength);

module.exports = router;
