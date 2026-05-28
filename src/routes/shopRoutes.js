const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listPublicShopsController,
  registerShopController,
  listShopsController,
  updateShopController,
  deleteShopController,
} = require('../controllers/shopController');

const router = express.Router();

router.get('/public', listPublicShopsController);
router.post('/register', registerShopController);

const guard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'local-stores'),
];

router.get('/', guard, listShopsController);
router.put('/:id', guard, updateShopController);
router.delete('/:id', guard, deleteShopController);

module.exports = router;
