const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  listHistoryController,
  activeCodeController,
  generateController,
  validateController,
} = require('../controllers/matchCodeController');

const router = express.Router();

router.get('/history', authMiddleware, listHistoryController);
router.get('/active', authMiddleware, activeCodeController);
router.get('/validate', authMiddleware, validateController);
router.post('/generate', authMiddleware, generateController);

module.exports = router;
