const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/', getSettings);
router.put('/', authorize('admin'), updateSettings);

module.exports = router;
