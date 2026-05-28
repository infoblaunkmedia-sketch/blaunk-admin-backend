const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listOrdersController,
  getOrderController,
  patchOrderStatusController,
} = require('../controllers/orderController');

const router = express.Router();

const guard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('customers', 'orders'),
];

router.get('/', guard, listOrdersController);
router.get('/:id', guard, getOrderController);
router.patch('/:id/status', guard, patchOrderStatusController);

module.exports = router;
