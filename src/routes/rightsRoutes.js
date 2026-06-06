const express = require('express');
const {
  saveRightsController,
  getRightsController,
  getMyRightsController,
} = require('../controllers/rightsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  requireSection('platform', 'rights'),
  saveRightsController,
);
router.get('/me', authMiddleware, getMyRightsController);
router.get('/:type/:code', authMiddleware, requireAdmin, getRightsController);

module.exports = router;
