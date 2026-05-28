const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listCategoriesController,
  listPublicCategoriesController,
  createCategoryController,
  patchCategoryController,
  deleteCategoryController,
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/public', listPublicCategoriesController);

const guard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('platform', 'categories'),
];

router.get('/', guard, listCategoriesController);
router.post('/', guard, createCategoryController);
router.patch('/:id', guard, patchCategoryController);
router.delete('/:id', guard, deleteCategoryController);

module.exports = router;
