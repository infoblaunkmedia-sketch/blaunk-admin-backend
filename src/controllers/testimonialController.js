const mongoose = require('mongoose');
const testimonialService = require('../services/testimonialService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listTestimonialsController(req, res) {
  try {
    const records = await testimonialService.listTestimonials();
    return res.json({ records });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to list testimonials.' });
  }
}

async function listPublicTestimonialsController(req, res) {
  try {
    const records = await testimonialService.listPublicTestimonials();
    return res.json({ records });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to list testimonials.' });
  }
}

async function createTestimonialController(req, res) {
  try {
    const record = await testimonialService.createTestimonial(req.body);
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to create testimonial.' });
  }
}

async function updateTestimonialController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await testimonialService.updateTestimonial(req.params.id, req.body);
    if (!record) return res.status(404).json({ message: 'Testimonial not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update testimonial.' });
  }
}

async function deleteTestimonialController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    await testimonialService.deleteTestimonial(req.params.id);
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to delete testimonial.' });
  }
}

module.exports = {
  listTestimonialsController,
  listPublicTestimonialsController,
  createTestimonialController,
  updateTestimonialController,
  deleteTestimonialController,
};
