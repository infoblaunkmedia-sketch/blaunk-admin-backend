const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireAnySectionOr3p } = require('../middleware/requirePermission');
const {
  listPayrollEmployeesController,
  listPayrollDepartmentsController,
  generatePayslipReportController,
} = require('../controllers/payslipReportController');

const router = express.Router();

const payrollGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireAnySectionOr3p([['people', 'payroll']], ['people']),
];

router.get('/employees', payrollGuard, listPayrollEmployeesController);
router.get('/departments', payrollGuard, listPayrollDepartmentsController);

router.post('/', payrollGuard, generatePayslipReportController);

module.exports = router;
