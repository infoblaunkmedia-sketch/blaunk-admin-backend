const mongoose = require('mongoose');

const payoutStatusEnum = [
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'REVERSE_BACK',
  'ON_HOLD',
  'DOUBLE_ENTRY',
  'ENTRY_MISSING',
];
const paymentModeEnum = ['Cash', 'QR', 'UPI', 'Swift', 'RTGS', 'NEFT'];

const dsaPayoutSchema = new mongoose.Schema(
  {
    dsaCode: { type: String, required: true, trim: true, index: true },
    dsaName: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    submittedAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, trim: true, default: 'INR' },
    currencyInr: { type: Number, default: null, min: 0 },
    shareRatio: { type: Number, default: 30, min: 0, max: 100 },
    calculatedLimit: { type: Number, default: null, min: 0 },
    mode: { type: String, enum: paymentModeEnum, default: 'NEFT' },
    transactionNumber: { type: String, trim: true, default: '' },
    submissionDate: { type: String, trim: true, default: '' },
    status: { type: String, enum: payoutStatusEnum, default: 'PENDING', index: true },
    approvalNote: { type: String, trim: true, default: '' },
    rejectionReason: { type: String, trim: true, default: '' },
    approvedBy: { type: String, trim: true, default: '' },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: String, trim: true, default: '' },
    rejectedAt: { type: Date, default: null },
    lastActedBy: { type: String, trim: true, default: '' },
    lastActedAt: { type: Date, default: null },
    newAmount: { type: Number, default: 0, min: 0 },
    bodBalance: { type: Number, default: 0, min: 0 },
    usedValue: { type: Number, default: 0, min: 0 },
    availableBalance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

dsaPayoutSchema.index({ dsaCode: 1, status: 1, createdAt: -1 });

const DsaPayout =
  mongoose.models.DsaPayout || mongoose.model('DsaPayout', dsaPayoutSchema);

module.exports = DsaPayout;
