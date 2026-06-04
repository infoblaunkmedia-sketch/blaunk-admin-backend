const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireAnySection, requireAnySectionOr3p } = require('../middleware/requirePermission');
const {
  listHistoryController,
  activeCodeController,
  generateController,
  validateController,
} = require('../controllers/matchCodeController');

const router = express.Router();

const matchSectionPairs = [
  ['settings', 'match-code'],
  ['marketing', 'match-doe'],
];

const matchAdminGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireAnySection(matchSectionPairs),
];

const matchReadGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireAnySectionOr3p([
    ['channelPartners', 'dsa'],
    ['marketing', 'media-ads'],
    ...matchSectionPairs,
  ]),
];

router.get('/history', matchAdminGuard, listHistoryController);
router.get('/active', matchReadGuard, activeCodeController);
router.get('/validate', matchReadGuard, validateController);
router.post('/generate', matchAdminGuard, generateController);

module.exports = router;
