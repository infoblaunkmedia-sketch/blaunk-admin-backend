const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listReviewsController,
  getReviewController,
  patchReviewController,
  deleteReviewController,
} = require('../controllers/reviewController');

const router = express.Router();

const reviewRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('customers', 'reviews'),
];

const reviewWrite = [...reviewRead];
const reviewDelete = [authMiddleware, requireAdmin, requireSection('customers', 'reviews')];

router.get('/', reviewRead, listReviewsController);
router.get('/:id', reviewRead, getReviewController);
router.patch('/:id', reviewWrite, patchReviewController);
router.delete('/:id', reviewDelete, deleteReviewController);

module.exports = router;
