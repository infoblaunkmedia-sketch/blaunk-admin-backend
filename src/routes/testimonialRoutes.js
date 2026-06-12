const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireAnySection } = require('../middleware/requirePermission');
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

/** CMS Upload or Admin Personnel → Media (same testimonials manager). */
const testimonialGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireAnySection([
    ['cms', 'banners'],
    ['adminPersonnel', 'media'],
  ]),
];

function runAdminList(req, res, next) {
  testimonialGuard[0](req, res, (err) => {
    if (err) return next(err);
    testimonialGuard[1](req, res, (err2) => {
      if (err2) return next(err2);
      testimonialGuard[2](req, res, (err3) => {
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

router.post('/', testimonialGuard, createTestimonialController);
router.put('/:id', testimonialGuard, updateTestimonialController);
router.delete('/:id', testimonialGuard, deleteTestimonialController);

module.exports = router;
