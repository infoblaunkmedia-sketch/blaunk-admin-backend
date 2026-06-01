const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireModule, requireSectionOr3p } = require('../middleware/requirePermission');
const {
  usageSummaryController,
  uploadStatusController,
} = require('../controllers/dsaLimitController');

const router = express.Router();

const financeRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireModule('finance'),
];

const dsaUploadStatus = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireSectionOr3p('channelPartners', 'dsa'),
];

router.get('/usage', financeRead, usageSummaryController);
router.get('/status', dsaUploadStatus, uploadStatusController);

module.exports = router;
