const mongoose = require('mongoose');

const dsaLimitSchema = new mongoose.Schema(
  {
    dsaCode: { type: String, required: true, trim: true, uppercase: true, unique: true },
    dsaName: { type: String, trim: true, default: '' },
    maxSlots: { type: Number, default: 0, min: 0 },
    newAmount: { type: Number, default: 0, min: 0 },
    bodBalance: { type: Number, default: 0, min: 0 },
    usedValue: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

dsaLimitSchema.index({ dsaCode: 1 });

const DsaLimit = mongoose.models.DsaLimit || mongoose.model('DsaLimit', dsaLimitSchema);

module.exports = DsaLimit;
