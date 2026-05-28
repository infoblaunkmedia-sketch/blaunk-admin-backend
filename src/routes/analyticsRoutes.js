const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { summaryController, chartsController } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/summary', authMiddleware, requireAdmin, summaryController);
router.get('/charts', authMiddleware, requireAdmin, chartsController);

module.exports = router;
