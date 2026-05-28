const mongoose = require('mongoose');

const OCCUPATIONS = [
  'owner',
  'manager',
  'founder',
  'retailer',
  'trader',
  'exporter',
  'wholesaler',
  'director',
];

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    occupation: { type: String, required: true, enum: OCCUPATIONS },
    country: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, required: true, trim: true, maxlength: 70 },
    profilePhotoUrl: { type: String, default: '', trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

testimonialSchema.index({ isActive: 1, sortOrder: 1 });

const Testimonial =
  mongoose.models.Testimonial || mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial;
module.exports.OCCUPATIONS = OCCUPATIONS;
