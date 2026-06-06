const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  getUserByCodeController,
  patchUserStatusController,
  generateTempPasswordController,
} = require('../controllers/userAdminController');

const router = express.Router();

const adminUserGuard = [
  authMiddleware,
  requireAdmin,
  requireSection('platform', 'rights'),
];

router.get('/:code', adminUserGuard, getUserByCodeController);
router.patch('/:code/status', adminUserGuard, patchUserStatusController);
router.post('/:code/temp-password', adminUserGuard, generateTempPasswordController);

module.exports = router;
