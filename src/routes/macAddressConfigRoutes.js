const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  getMacAddressConfigController,
  addMacAddressConfigController,
  deleteMacAddressConfigController,
  saveAllMacAddressConfigController,
} = require('../controllers/macAddressConfigController');

const router = express.Router();

const settingsGuard = [
  authMiddleware,
  requireAdmin,
  requireSection('platform', 'security'),
];

router.get('/', settingsGuard, getMacAddressConfigController);
router.post('/', settingsGuard, addMacAddressConfigController);
router.post('/save-all', settingsGuard, saveAllMacAddressConfigController);
router.delete('/:id', settingsGuard, deleteMacAddressConfigController);

module.exports = router;
