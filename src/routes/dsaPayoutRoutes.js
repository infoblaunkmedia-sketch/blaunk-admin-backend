const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  listPayoutsController,
  createPayoutController,
  approvePayoutController,
  rejectPayoutController,
  updatePayoutStatusController,
} = require('../controllers/dsaPayoutController');

const router = express.Router();

router.get('/', authMiddleware, listPayoutsController);
router.post('/', authMiddleware, createPayoutController);
router.patch('/:id/status', authMiddleware, updatePayoutStatusController);
router.patch('/:id/approve', authMiddleware, approvePayoutController);
router.patch('/:id/reject', authMiddleware, rejectPayoutController);

module.exports = router;
