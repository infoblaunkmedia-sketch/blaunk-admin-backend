const express = require('express');
const {
  saveRightsController,
  getRightsController,
  getMyRightsController,
} = require('../controllers/rightsController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/requireRole');
const { requireAnySection } = require('../middleware/requirePermission');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  requireAdmin,
  requireAnySection([
    ['platform', 'rights'],
    ['it', 'rights'],
  ]),
  saveRightsController,
);
router.get('/me', authMiddleware, getMyRightsController);
router.get('/:type/:code', authMiddleware, requireAdmin, getRightsController);

module.exports = router;
