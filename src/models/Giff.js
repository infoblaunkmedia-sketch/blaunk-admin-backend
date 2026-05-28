const mongoose = require('mongoose');

const giffSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    imageUrl: { type: String, default: '', trim: true },
    format: { type: String, default: 'gif', trim: true, lowercase: true },
    sortOrder: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

giffSchema.index({ category: 1, sortOrder: 1 });

const Giff = mongoose.models.Giff || mongoose.model('Giff', giffSchema);
module.exports = Giff;
