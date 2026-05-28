const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const { listConfigsController, saveConfigsController } = require('../controllers/mediaSlotConfigController');

const router = express.Router();

const slotRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('marketing', 'slot-settings'),
];

router.get('/', slotRead, listConfigsController);
router.put('/', authMiddleware, requireAdmin, saveConfigsController);

module.exports = router;
