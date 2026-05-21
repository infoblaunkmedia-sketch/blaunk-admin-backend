const mongoose = require('mongoose');

const matchCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, index: true },
    generatedBy: { type: String, trim: true, default: 'system' },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

matchCodeSchema.index({ createdAt: -1 });

const MatchCode = mongoose.models.MatchCode || mongoose.model('MatchCode', matchCodeSchema);

module.exports = MatchCode;
