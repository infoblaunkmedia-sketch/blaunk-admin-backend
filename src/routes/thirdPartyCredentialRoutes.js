const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listThirdPartyCredentialsController,
  getThirdPartyCredentialController,
  saveThirdPartyCredentialController,
  deleteThirdPartyCredentialController,
} = require('../controllers/thirdPartyCredentialController');

const router = express.Router();

const credGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('people', '3p-credentials'),
];

router.get('/', credGuard, listThirdPartyCredentialsController);
router.post('/', credGuard, saveThirdPartyCredentialController);
router.get('/:id', credGuard, getThirdPartyCredentialController);
router.delete('/:id', credGuard, deleteThirdPartyCredentialController);

module.exports = router;
