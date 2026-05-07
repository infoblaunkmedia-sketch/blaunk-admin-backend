const express = require('express');
const {
  getDepartmentsController,
  listEmployeeCredentialsController,
  saveEmployeeCredentialsController,
  getEmployeeCredentialsController,
  deleteEmployeeCredentialsController,
} = require('../controllers/employeeCredentialsController');

const router = express.Router();

// List employee credentials (must be before /departments and /:pan)
router.get('/', listEmployeeCredentialsController);

// List distinct departments (must be before /:pan)
router.get('/departments', getDepartmentsController);

// Save or update employee credentials for a given PAN
router.post('/', saveEmployeeCredentialsController);

// Fetch employee credentials by PAN
router.get('/:pan', getEmployeeCredentialsController);

// Delete employee credentials by PAN
router.delete('/:pan', deleteEmployeeCredentialsController);

module.exports = router;

