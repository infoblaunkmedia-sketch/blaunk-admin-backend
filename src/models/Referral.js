const mongoose = require('mongoose');

const EVENT_TYPES = ['signup', 'first_order'];
const PAYOUT_STATUSES = ['pending', 'paid', 'cancelled'];

const referralSchema = new mongoose.Schema(
  {
    dsaCode: { type: String, required: true, trim: true, uppercase: true, index: true },
    referredUserId: { type: String, required: true, trim: true },
    referredUserName: { type: String, default: '', trim: true },
    eventType: { type: String, enum: EVENT_TYPES, required: true },
    commissionRate: { type: Number, default: 0, min: 0, max: 100 },
    commissionAmount: { type: Number, default: 0, min: 0 },
    payoutStatus: { type: String, enum: PAYOUT_STATUSES, default: 'pending' },
  },
  { timestamps: true },
);

referralSchema.index({ dsaCode: 1, referredUserId: 1, eventType: 1 });

const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);
module.exports = Referral;
module.exports.EVENT_TYPES = EVENT_TYPES;
module.exports.PAYOUT_STATUSES = PAYOUT_STATUSES;
