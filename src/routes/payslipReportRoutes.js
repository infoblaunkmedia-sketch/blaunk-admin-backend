const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  generatePayslipReportController,
} = require('../controllers/payslipReportController');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('people', 'payroll'),
  generatePayslipReportController,
);

module.exports = router;
