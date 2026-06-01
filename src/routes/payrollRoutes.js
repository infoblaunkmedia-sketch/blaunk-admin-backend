const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireAnySectionOr3p } = require('../middleware/requirePermission');
const {
  listPayrollController,
  getPayrollController,
  createPayrollController,
  updatePayrollController,
  deletePayrollController,
} = require('../controllers/payrollController');

const router = express.Router();

const payrollRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireAnySectionOr3p([['people', 'payroll']], ['people']),
];

const payrollAdmin = [authMiddleware, requireAdmin];

router.get('/', payrollRead, listPayrollController);
router.get('/:id', payrollRead, getPayrollController);
router.post('/', payrollAdmin, createPayrollController);
router.patch('/:id', payrollAdmin, updatePayrollController);
router.delete('/:id', payrollAdmin, deletePayrollController);

module.exports = router;
