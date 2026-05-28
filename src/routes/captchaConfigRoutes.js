const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  getCaptchaConfigController,
  saveCaptchaConfigController,
} = require('../controllers/captchaConfigController');

const router = express.Router();

const settingsGuard = [
  authMiddleware,
  requireAdmin,
  requireSection('settings', 'security'),
];

router.get('/', settingsGuard, getCaptchaConfigController);
router.post('/', settingsGuard, saveCaptchaConfigController);

module.exports = router;
