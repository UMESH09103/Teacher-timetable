const express = require('express');
const router = express.Router();
const { getReports, exportExcel, exportPdf } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/', getReports);
router.get('/export/excel', exportExcel);
router.get('/export/pdf', exportPdf);

module.exports = router;
