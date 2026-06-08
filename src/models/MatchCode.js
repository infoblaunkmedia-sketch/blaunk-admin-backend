const mongoose = require('mongoose');

const matchCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, index: true },
    generatedBy: { type: String, trim: true, default: 'system' },
    /** 3P employee / DSA code this match code was generated for */
    generatorFor: { type: String, trim: true, default: '', index: true },
    validUntil: { type: Date, default: null, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

matchCodeSchema.index({ createdAt: -1 });

const MatchCode = mongoose.models.MatchCode || mongoose.model('MatchCode', matchCodeSchema);

module.exports = MatchCode;
