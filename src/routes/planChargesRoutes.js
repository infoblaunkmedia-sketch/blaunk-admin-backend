const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireModule } = require('../middleware/requirePermission');
const {
  listPlanChargesController,
  patchPlanChargeController,
} = require('../controllers/planChargesController');

const router = express.Router();

const platformAdmin = [
  authMiddleware,
  requireRole(ROLES.ADMIN),
  requireModule('platform'),
];

router.get('/', platformAdmin, listPlanChargesController);
router.patch('/:id', platformAdmin, patchPlanChargeController);

module.exports = router;
