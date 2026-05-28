const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listSiteMediaController,
  listPublicSiteMediaController,
  upsertSiteMediaSlotController,
  clearSiteMediaSlotController,
} = require('../controllers/siteMediaController');

const router = express.Router();

/** Public website — no auth. Optional ?section=home-page-slider */
router.get('/public', listPublicSiteMediaController);

const mediaGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('adminPersonnel', 'media'),
];

router.get('/', mediaGuard, listSiteMediaController);
router.put('/slots', mediaGuard, upsertSiteMediaSlotController);
router.delete('/slots', mediaGuard, clearSiteMediaSlotController);

module.exports = router;
