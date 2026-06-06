const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  getIpAddressConfigController,
  addIpAddressConfigController,
  deleteIpAddressConfigController,
  saveAllIpAddressConfigController,
} = require('../controllers/ipAddressConfigController');

const router = express.Router();

const settingsGuard = [
  authMiddleware,
  requireAdmin,
  requireSection('platform', 'security'),
];

router.get('/', settingsGuard, getIpAddressConfigController);
router.post('/', settingsGuard, addIpAddressConfigController);
router.post('/save-all', settingsGuard, saveAllIpAddressConfigController);
router.delete('/:id', settingsGuard, deleteIpAddressConfigController);

module.exports = router;
