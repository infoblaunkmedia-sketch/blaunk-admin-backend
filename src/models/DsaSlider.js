const mongoose = require('mongoose');

const dsaSliderSchema = new mongoose.Schema(
  {
    mediaTab: { type: String, required: true, trim: true, default: 'Slider' },
    imageUrl: { type: String, required: true, trim: true },
    section: { type: String, trim: true, default: 'HOMEPAGE' },
    country: { type: String, trim: true, default: 'India' },
    plan: { type: String, trim: true, default: 'Standard (2M)' },
    productId: { type: String, trim: true, default: '' },
    planCharge: { type: Number, default: 0, min: 0 },
    luxuryFees: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    toPay: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['Draft', 'Active', 'Inactive'], default: 'Draft' },
    uploadDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    dsaCode: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

dsaSliderSchema.index({ mediaTab: 1, section: 1, country: 1 }, { unique: true });
dsaSliderSchema.index({ mediaTab: 1, section: 1, country: 1, status: 1, uploadDate: 1, expiryDate: 1 });
dsaSliderSchema.index({ status: 1, uploadDate: 1, expiryDate: 1 });
dsaSliderSchema.index({ mediaTab: 'text', productId: 'text' });

const DsaSlider =
  mongoose.models.DsaSlider ||
  mongoose.model('DsaSlider', dsaSliderSchema);

module.exports = DsaSlider;

