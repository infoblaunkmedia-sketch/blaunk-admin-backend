const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listPublicCategoriesController,
  listCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
} = require('../controllers/shopCategoryController');

const router = express.Router();

router.get('/public', listPublicCategoriesController);

const guard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'store-categories'),
];

router.get('/', guard, listCategoriesController);
router.post('/', guard, createCategoryController);
router.put('/:id', guard, updateCategoryController);
router.delete('/:id', guard, deleteCategoryController);

module.exports = router;
