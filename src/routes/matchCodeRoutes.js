const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listHistoryController,
  activeCodeController,
  generateController,
  validateController,
} = require('../controllers/matchCodeController');

const router = express.Router();

const matchGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('marketing', 'match-doe'),
];

router.get('/history', matchGuard, listHistoryController);
router.get('/active', matchGuard, activeCodeController);
router.get('/validate', matchGuard, validateController);
router.post('/generate', matchGuard, generateController);

module.exports = router;
