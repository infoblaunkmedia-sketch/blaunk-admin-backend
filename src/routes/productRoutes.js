const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listProductsController,
  listPublicProductsController,
  createProductController,
  patchProductStatusController,
} = require('../controllers/productController');

const router = express.Router();

router.get('/public', listPublicProductsController);

const guard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('platform', 'products'),
];

router.get('/', guard, listProductsController);
router.post('/', guard, createProductController);
router.patch('/:id/status', guard, patchProductStatusController);

module.exports = router;
