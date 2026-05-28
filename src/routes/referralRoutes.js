const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireSectionOr3p } = require('../middleware/requirePermission');
const {
  trackReferralController,
  listReferralsController,
} = require('../controllers/referralController');

const router = express.Router();

router.post('/track', trackReferralController);

const readGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireSectionOr3p('channelPartners', 'dsa'),
];

router.get('/', readGuard, listReferralsController);

module.exports = router;
