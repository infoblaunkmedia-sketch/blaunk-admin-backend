const mongoose = require('mongoose');

const ACCOUNT_STATUSES = ['Active', 'Suspended', 'Blocked'];

const individualCustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    mobile: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: 'Active',
    },
    lastLoginDate: { type: Date, default: null },
    totalOrders: { type: Number, default: 0, min: 0 },
    internalNotes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

individualCustomerSchema.index({ email: 1 });
individualCustomerSchema.index({ fullName: 'text', email: 'text', mobile: 'text', customerId: 'text' });
individualCustomerSchema.index({ accountStatus: 1, createdAt: -1 });

const IndividualCustomer =
  mongoose.models.IndividualCustomer ||
  mongoose.model('IndividualCustomer', individualCustomerSchema);

module.exports = IndividualCustomer;
module.exports.ACCOUNT_STATUSES = ACCOUNT_STATUSES;
