const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listIndividualsController,
  getIndividualController,
  patchIndividualStatusController,
} = require('../controllers/individualCustomerController');

const router = express.Router();

const b2cGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('customers', 'individuals'),
];

router.get('/', b2cGuard, listIndividualsController);
router.get('/:id', b2cGuard, getIndividualController);
router.patch('/:id/status', b2cGuard, patchIndividualStatusController);

module.exports = router;
