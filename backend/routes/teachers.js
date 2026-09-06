const express = require('express');
const router = express.Router();
const {
  getTeachers, getTeacher, createTeacher,
  updateTeacher, deleteTeacher, toggleStatus
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getTeachers)
  .post(createTeacher);

router.route('/:id')
  .get(getTeacher)
  .put(updateTeacher)
  .delete(deleteTeacher);

router.put('/:id/toggle-status', toggleStatus);

module.exports = router;
