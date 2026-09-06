const express = require('express');
const router = express.Router();
const { getStandards, createStandard, updateStandard, deleteStandard } = require('../controllers/standardController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.route('/')
  .get(getStandards)
  .post(authorize('admin'), createStandard);

router.route('/:id')
  .put(authorize('admin'), updateStandard)
  .delete(authorize('admin'), deleteStandard);

module.exports = router;
