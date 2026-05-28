const mongoose = require('mongoose');

const focalPointSchema = new mongoose.Schema(
  {
    x: { type: Number, default: 50, min: 0, max: 100 },
    y: { type: Number, default: 50, min: 0, max: 100 },
  },
  { _id: false },
);

const bannerSchema = new mongoose.Schema(
  {
    page: { type: String, required: true, trim: true, lowercase: true, index: true },
    position: { type: String, required: true, trim: true, lowercase: true, index: true },
    title: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '', trim: true },
    linkUrl: { type: String, default: '', trim: true },
    tag: { type: String, default: '', trim: true },
    subtitle: { type: String, default: '', trim: true },
    ctaText: { type: String, default: '', trim: true },
    titleAccent: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    overlayQuote: { type: String, default: '', trim: true },
    variant: { type: String, default: '', trim: true, lowercase: true },
    focalPoint: { type: focalPointSchema, default: () => ({ x: 50, y: 50 }) },
    isActive: { type: Boolean, default: true, index: true },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

bannerSchema.index({ page: 1, position: 1, sortOrder: 1 });

const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
module.exports = Banner;
