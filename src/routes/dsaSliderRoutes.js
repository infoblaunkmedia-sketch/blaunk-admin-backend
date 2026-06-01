const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireAnySectionOr3p } = require('../middleware/requirePermission');
const { scopeDsaCodeQuery } = require('../middleware/scopeOwnResource');
const {
  listSlidersController,
  getSliderController,
  createSliderController,
  updateSliderController,
  deleteSliderController,
  listPublicSlidersBySlotController,
  sliderSummaryController,
  slotStatusController,
} = require('../controllers/dsaSliderController');

const router = express.Router();

// Public consumption endpoint for external projects (no auth).
router.get('/public', listPublicSlidersBySlotController);

const sliderRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P),
  requireAnySectionOr3p(
    [
      ['channelPartners', 'dsa'],
      ['marketing', 'media-ads'],
    ],
    ['sales'],
  ),
];

const sliderWrite = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.THREE_P),
  requireAnySectionOr3p(
    [
      ['channelPartners', 'dsa'],
      ['marketing', 'media-ads'],
    ],
    ['sales'],
  ),
];

router.get('/summary', sliderRead, scopeDsaCodeQuery, sliderSummaryController);
router.get('/slot-status', sliderRead, slotStatusController);
router.get('/', sliderRead, scopeDsaCodeQuery, listSlidersController);
router.post('/', sliderWrite, createSliderController);
router.get('/:id', sliderRead, getSliderController);
router.put('/:id', sliderWrite, updateSliderController);
router.delete('/:id', sliderWrite, deleteSliderController);

module.exports = router;
