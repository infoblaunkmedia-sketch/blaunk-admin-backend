const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection, requireAnySection } = require('../middleware/requirePermission');
const {
  saveShareholdingController,
  listShareholdingsController,
  getShareholdingController,
  deleteShareholdingHistoryController,
  deleteShareholdingController,
  exportShareholdingMISController,
} = require('../controllers/shareholdingController');

const router = express.Router();

const corporateGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('corporate', 'shareholding'),
];

router.get('/', corporateGuard, listShareholdingsController);
router.post('/', corporateGuard, saveShareholdingController);
const misExportGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireAnySection([
    ['corporate', 'shareholding'],
    ['corporate', 'mis'],
  ]),
];

router.post('/mis-export', misExportGuard, exportShareholdingMISController);
router.delete('/:pan/history/:historyId', corporateGuard, deleteShareholdingHistoryController);
router.get('/:pan', corporateGuard, getShareholdingController);
router.delete('/:pan', corporateGuard, deleteShareholdingController);

module.exports = router;
