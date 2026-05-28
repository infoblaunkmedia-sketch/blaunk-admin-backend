const mongoose = require('mongoose');

const siteMediaAssetSchema = new mongoose.Schema(
  {
    section: { type: String, required: true, trim: true, index: true },
    slot: { type: Number, required: true, min: 1 },
    kind: { type: String, enum: ['image', 'url'], required: true },
    value: { type: String, default: '', trim: true },
    fileName: { type: String, default: '', trim: true },
    /** Display name for social links, e.g. Instagram, Youtube */
    title: { type: String, default: '', trim: true },
    /** Optional structured payload for section-specific metadata. */
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

siteMediaAssetSchema.index({ section: 1, slot: 1 }, { unique: true });

const SiteMediaAsset =
  mongoose.models.SiteMediaAsset || mongoose.model('SiteMediaAsset', siteMediaAssetSchema);

module.exports = SiteMediaAsset;
