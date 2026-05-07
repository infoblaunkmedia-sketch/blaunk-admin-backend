const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  listSlidersController,
  getSliderController,
  createSliderController,
  updateSliderController,
  deleteSliderController,
  listPublicSlidersBySlotController,
  sliderSummaryController,
} = require('../controllers/dsaSliderController');

const router = express.Router();

// Public consumption endpoint for external projects.
router.get('/public', listPublicSlidersBySlotController);
router.get('/summary', authMiddleware, sliderSummaryController);

// Authenticated management APIs.
router.get('/', authMiddleware, listSlidersController);
router.post('/', authMiddleware, createSliderController);
router.get('/:id', authMiddleware, getSliderController);
router.put('/:id', authMiddleware, updateSliderController);
router.delete('/:id', authMiddleware, deleteSliderController);

module.exports = router;

