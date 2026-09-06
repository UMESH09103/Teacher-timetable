const express = require('express');
const router = express.Router();
const {
  submitAttendance, updateAttendance, checkAttendance,
  getAttendanceHistory, getAttendance, deleteAttendance,
  getClassWiseSummary
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/check', checkAttendance);
router.get('/history', getAttendanceHistory);
router.get('/class-summary', authorize('admin'), getClassWiseSummary);

router.route('/')
  .post(submitAttendance);

router.route('/:id')
  .get(getAttendance)
  .put(updateAttendance)
  .delete(authorize('admin'), deleteAttendance);

module.exports = router;
