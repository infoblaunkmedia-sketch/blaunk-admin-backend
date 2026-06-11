const mongoose = require('mongoose');

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

const shareholdingHistorySchema = new mongoose.Schema(
  {
    shareholder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shareholder',
      required: true,
      index: true,
    },
    pan: { type: String, required: true, uppercase: true, trim: true, index: true },
    year: { type: String, required: true, trim: true },
    projectKey: { type: String, default: '_', trim: true },
    holdingPercent: Number,
    shareType: String,
    faceValue: Number,
    numberOfShares: Number,
    mode: String,
    isinCode: String,
    dpNumber: String,
    dp: String,
    beneficiaryDpId: String,
    folioNumber: String,
    certificateNumber: String,
    distinctiveFrom: String,
    distinctiveTo: String,
    yearOfIssuance: String,
    stakeholder: String,
    dateOfAllotment: String,
    remarks: String,
    exitDate: String,
    bankName: String,
    ifscCode: String,
    bankAccountNumber: String,
    bankCity: String,
    bankCountry: String,
    pledge: String,
    shareStatus: String,
    dataEntryBy: String,
    nominees: [nomineeSchema],
  },
  { timestamps: true },
);

shareholdingHistorySchema.index({ pan: 1, year: 1, projectKey: 1 }, { unique: true });

module.exports =
  mongoose.models.ShareholdingHistory ||
  mongoose.model('ShareholdingHistory', shareholdingHistorySchema);
