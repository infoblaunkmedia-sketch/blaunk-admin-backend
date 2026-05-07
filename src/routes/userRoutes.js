const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  getUserByCodeController,
  patchUserStatusController,
  generateTempPasswordController,
} = require('../controllers/userAdminController');

const router = express.Router();

router.get('/:code', authMiddleware, requireAdmin, getUserByCodeController);
router.patch('/:code/status', authMiddleware, requireAdmin, patchUserStatusController);
router.post('/:code/temp-password', authMiddleware, requireAdmin, generateTempPasswordController);

module.exports = router;

