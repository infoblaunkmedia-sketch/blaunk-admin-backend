const mongoose = require('mongoose');

/**
 * Pre-split collection `shareholdings` — used only to migrate into
 * Shareholder + ShareholdingHistory. New writes use the new models.
 */
const nomineeSchema = new mongoose.Schema(
  {
    name: String,
    mobile: String,
    relation: String,
    percentage: Number,
    pan: String,
  },
  { _id: false },
);

const shareholdingLegacySchema = new mongoose.Schema(
  {
    pan: { type: String, required: true, index: true },
    name: String,
    mobile: String,
    email: String,
    aadhaar: String,
    address: String,
    city: String,
    landmark: String,
    country: String,
    gender: String,
    holdingPercent: Number,
    shareType: String,
    faceValue: Number,
    numberOfShares: Number,
    mode: String,
    isinCode: String,
    dpNumber: String,
    folioNumber: String,
    distinctiveFrom: String,
    distinctiveTo: String,
    yearOfIssuance: String,
    stakeholder: String,
    dateOfAllotment: String,
    remarks: String,
    exitDate: String,
    year: String,
    bankName: String,
    ifscCode: String,
    bankAccountNumber: String,
    pledge: String,
    nominees: [nomineeSchema],
  },
  { timestamps: true, collection: 'shareholdings' },
);

module.exports =
  mongoose.models.ShareholdingLegacy ||
  mongoose.model('ShareholdingLegacy', shareholdingLegacySchema);
