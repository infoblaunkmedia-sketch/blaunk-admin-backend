const mongoose = require('mongoose');

const FIELD_STATUSES = ['Pending', 'Verified', 'Rejected'];

const verifierSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller',
      required: true,
      unique: true,
      index: true,
    },
    emailStatus: { type: String, enum: FIELD_STATUSES, default: 'Pending' },
    mobileStatus: { type: String, enum: FIELD_STATUSES, default: 'Pending' },
    photoStatus: { type: String, enum: FIELD_STATUSES, default: 'Pending' },
    bankStatus: { type: String, enum: FIELD_STATUSES, default: 'Pending' },
    shopLocationStatus: { type: String, enum: FIELD_STATUSES, default: 'Pending' },
    submittedBy: { type: String, trim: true, default: '' },
    reviewedBy: { type: String, trim: true, default: '' },
    overallStatus: { type: String, enum: FIELD_STATUSES, default: 'Pending' },
  },
  { timestamps: true },
);

verifierSchema.index({ overallStatus: 1, updatedAt: -1 });

const Verifier =
  mongoose.models.Verifier || mongoose.model('Verifier', verifierSchema);

module.exports = Verifier;
module.exports.FIELD_STATUSES = FIELD_STATUSES;
