const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listBannersController,
  listPublicBannersController,
  createBannerController,
  patchBannerController,
  putBannerController,
  deleteBannerController,
} = require('../controllers/bannerController');

const router = express.Router();

router.get('/public', listPublicBannersController);

const guard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'banners'),
];

router.get('/', guard, listBannersController);
router.post('/', guard, createBannerController);
router.put('/:id', guard, putBannerController);
router.patch('/:id', guard, patchBannerController);
router.delete('/:id', guard, deleteBannerController);

module.exports = router;
