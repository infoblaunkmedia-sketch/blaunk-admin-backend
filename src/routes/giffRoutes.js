const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listCategoriesController,
  listGiffsController,
  listPublicGiffsController,
  createGiffController,
  putGiffController,
  patchGiffController,
  deleteGiffController,
} = require('../controllers/giffController');

const router = express.Router();

router.get('/public', listPublicGiffsController);
router.get('/categories', listCategoriesController);

const guard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'giff'),
];

router.get('/', guard, listGiffsController);
router.post('/', guard, createGiffController);
router.put('/:id', guard, putGiffController);
router.patch('/:id', guard, patchGiffController);
router.delete('/:id', guard, deleteGiffController);

module.exports = router;
