const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection, requireAnySection } = require('../middleware/requirePermission');
const {
  saveShareholdingController,
  listShareholdingsController,
  getShareholdingController,
  deleteShareholdingHistoryController,
  deleteShareholdingController,
  listShareholdingMISController,
  exportShareholdingMISController,
  importShareholdingMISController,
} = require('../controllers/shareholdingController');

const misUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

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

router.get('/mis', misExportGuard, listShareholdingMISController);
router.post('/mis', misExportGuard, listShareholdingMISController);
router.post('/mis-export', misExportGuard, exportShareholdingMISController);
router.post('/mis-import', misExportGuard, misUpload.single('file'), importShareholdingMISController);
router.delete('/:pan/history/:historyId', corporateGuard, deleteShareholdingHistoryController);
router.get('/:pan', corporateGuard, getShareholdingController);
router.delete('/:pan', corporateGuard, deleteShareholdingController);

module.exports = router;
