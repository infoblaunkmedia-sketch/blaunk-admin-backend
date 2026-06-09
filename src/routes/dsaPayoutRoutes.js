const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireSection, requireSectionOr3p } = require('../middleware/requirePermission');
const { scopeDsaCodeQuery } = require('../middleware/scopeOwnResource');
const {
  listPayoutsController,
  createPayoutController,
  approvePayoutController,
  rejectPayoutController,
  updatePayoutStatusController,
  updatePayoutFieldsController,
} = require('../controllers/dsaPayoutController');
const { ledgerController } = require('../controllers/referralController');

const router = express.Router();

const payoutAccess = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireSectionOr3p('finance', 'dsa-payouts'),
];

const financeDsaChecker = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('finance', 'dsa-payouts'),
];

router.get('/ledger', payoutAccess, ledgerController);
router.get('/', payoutAccess, scopeDsaCodeQuery, listPayoutsController);
router.post('/', payoutAccess, createPayoutController);
router.patch('/:id/fields', financeDsaChecker, updatePayoutFieldsController);
router.patch('/:id/status', financeDsaChecker, updatePayoutStatusController);
router.patch('/:id/approve', financeDsaChecker, approvePayoutController);
router.patch('/:id/reject', financeDsaChecker, rejectPayoutController);

module.exports = router;
