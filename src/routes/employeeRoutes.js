const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { listEmployeeCodesController, nextEmployeeCodeController } = require('../controllers/employeeController');

const router = express.Router();

router.get('/codes', authMiddleware, requireAdmin, listEmployeeCodesController);
router.get('/next-code', authMiddleware, requireAdmin, nextEmployeeCodeController);

module.exports = router;
