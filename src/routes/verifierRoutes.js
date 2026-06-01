const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSectionOr3p } = require('../middleware/requirePermission');
const {
  listVerifiersController,
  submitVerifierController,
  reviewVerifierController,
} = require('../controllers/verifierController');

const router = express.Router();

const verifierReadGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireSectionOr3p('channelPartners', 'verifiers'),
];

const makerWriteGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireSectionOr3p('channelPartners', 'verifiers'),
];

router.get('/', verifierReadGuard, listVerifiersController);
router.post('/:vendorId/submit', makerWriteGuard, submitVerifierController);
router.patch('/:vendorId/review', authMiddleware, reviewVerifierController);

module.exports = router;
