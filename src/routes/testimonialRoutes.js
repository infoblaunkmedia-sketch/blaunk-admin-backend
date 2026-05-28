const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const { testimonialListAuth } = require('../middleware/testimonialListAuth');
const {
  listTestimonialsController,
  listPublicTestimonialsController,
  createTestimonialController,
  updateTestimonialController,
  deleteTestimonialController,
} = require('../controllers/testimonialController');

const router = express.Router();

router.get('/public', listPublicTestimonialsController);

const cmsGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'banners'),
];

function runAdminList(req, res, next) {
  cmsGuard[0](req, res, (err) => {
    if (err) return next(err);
    cmsGuard[1](req, res, (err2) => {
      if (err2) return next(err2);
      cmsGuard[2](req, res, (err3) => {
        if (err3) return next(err3);
        return listTestimonialsController(req, res);
      });
    });
  });
}

router.get('/', testimonialListAuth, (req, res, next) => {
  if (req.testimonialsPublicList) {
    return listPublicTestimonialsController(req, res);
  }
  return runAdminList(req, res, next);
});

router.post('/', cmsGuard, createTestimonialController);
router.put('/:id', cmsGuard, updateTestimonialController);
router.delete('/:id', cmsGuard, deleteTestimonialController);

module.exports = router;
