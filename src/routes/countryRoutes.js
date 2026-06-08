const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listCountriesController,
  createCountryController,
  patchCountryController,
  deleteCountryController,
} = require('../controllers/countryController');

const router = express.Router();

router.get('/', authMiddleware, listCountriesController);

const manageGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN),
  requireSection('platform', 'countries'),
];

router.post('/', manageGuard, createCountryController);
router.patch('/:id', manageGuard, patchCountryController);
router.delete('/:id', manageGuard, deleteCountryController);

module.exports = router;
