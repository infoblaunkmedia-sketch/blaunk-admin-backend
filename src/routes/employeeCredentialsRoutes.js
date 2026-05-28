const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  getDepartmentsController,
  listEmployeeCredentialsController,
  saveEmployeeCredentialsController,
  getEmployeeCredentialsController,
  deleteEmployeeCredentialsController,
} = require('../controllers/employeeCredentialsController');

const router = express.Router();

const hrGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('people', 'employees'),
];

router.get('/', hrGuard, listEmployeeCredentialsController);
router.get('/departments', hrGuard, getDepartmentsController);
router.post('/', hrGuard, saveEmployeeCredentialsController);
router.get('/:pan', hrGuard, getEmployeeCredentialsController);
router.delete('/:pan', hrGuard, deleteEmployeeCredentialsController);

module.exports = router;
