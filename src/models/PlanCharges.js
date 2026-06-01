const mongoose = require('mongoose');

const planChargesSchema = new mongoose.Schema(
  {
    planName: { type: String, required: true, trim: true, unique: true },
    durationMonths: { type: Number, required: true, min: 1 },
    subscriptionFee: { type: Number, default: 0, min: 0 },
    renewalFee: { type: Number, default: 0, min: 0 },
    maxMRP: { type: Number, default: 0, min: 0 },
    offer: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const PlanCharges =
  mongoose.models.PlanCharges || mongoose.model('PlanCharges', planChargesSchema);

module.exports = PlanCharges;
