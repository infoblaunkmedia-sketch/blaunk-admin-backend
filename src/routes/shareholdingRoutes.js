const express = require('express');
const {
  saveShareholdingController,
  listShareholdingsController,
  getShareholdingController,
  deleteShareholdingHistoryController,
  deleteShareholdingController,
  exportShareholdingMISController,
} = require('../controllers/shareholdingController');

const router = express.Router();

// List shareholding records (must be before /:pan)
router.get('/', listShareholdingsController);

// Save or update shareholding info (including nominees) for a given PAN
router.post('/', saveShareholdingController);

// MIS export: shareholding + HR credential columns (Excel)
router.post('/mis-export', exportShareholdingMISController);

// Delete one year/project history row (shareholder kept if other rows exist)
router.delete('/:pan/history/:historyId', deleteShareholdingHistoryController);

// Fetch shareholding + employee credential (same PAN) for aligned master data
router.get('/:pan', getShareholdingController);

// Delete shareholder and all history by PAN
router.delete('/:pan', deleteShareholdingController);

module.exports = router;

