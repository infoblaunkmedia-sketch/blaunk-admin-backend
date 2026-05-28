const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireSectionOr3p } = require('../middleware/requirePermission');
const { scopeDsaCodeQuery } = require('../middleware/scopeOwnResource');
const {
  listPayoutsController,
  createPayoutController,
  approvePayoutController,
  rejectPayoutController,
  updatePayoutStatusController,
} = require('../controllers/dsaPayoutController');
const { ledgerController } = require('../controllers/referralController');

const router = express.Router();

const payoutAccess = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireSectionOr3p('finance', 'dsa-payouts'),
];

router.get('/ledger', payoutAccess, ledgerController);
router.get('/', payoutAccess, scopeDsaCodeQuery, listPayoutsController);
router.post('/', payoutAccess, createPayoutController);
router.patch('/:id/status', authMiddleware, requireAdmin, updatePayoutStatusController);
router.patch('/:id/approve', authMiddleware, requireAdmin, approvePayoutController);
router.patch('/:id/reject', authMiddleware, requireAdmin, rejectPayoutController);

module.exports = router;
