const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireAnySection } = require('../middleware/requirePermission');
const { listConfigsController, saveConfigsController } = require('../controllers/mediaSlotConfigController');

const router = express.Router();

const slotRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireAnySection([
    ['settings', 'slot-settings'],
    ['marketing', 'slot-settings'],
  ]),
];

router.get('/', slotRead, listConfigsController);
router.put('/', authMiddleware, requireAdmin, saveConfigsController);

module.exports = router;
