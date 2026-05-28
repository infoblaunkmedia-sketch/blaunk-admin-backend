const mongoose = require('mongoose');

const APPROVAL_STATUSES = ['pending', 'approved', 'rejected'];
const KYC_STATUSES = ['Pending', 'Verified', 'Rejected'];
const VENDOR_STATUSES = ['Active', 'Inactive', 'Suspended'];

const bankSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, default: '', trim: true },
    accountNumber: { type: String, default: '', trim: true },
    ifsc: { type: String, default: '', trim: true },
    bankName: { type: String, default: '', trim: true },
    branch: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const kycDocumentSchema = new mongoose.Schema(
  {
    docType: { type: String, default: 'KYC', trim: true },
    fileName: { type: String, required: true },
    originalName: { type: String, default: '' },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: String, default: '', trim: true },
  },
  { _id: true },
);

const sellerSchema = new mongoose.Schema(
  {
    vendorCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    businessName: { type: String, required: true, trim: true },
    ownerName: { type: String, default: '', trim: true },
    mobile: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    address: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    country: { type: String, default: 'India', trim: true },
    productCategories: { type: String, default: '', trim: true },
    bank: { type: bankSchema, default: () => ({}) },
    kycStatus: { type: String, enum: KYC_STATUSES, default: 'Pending' },
    status: { type: String, enum: VENDOR_STATUSES, default: 'Active' },
    approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: 'pending' },
    rejectionReason: { type: String, default: '', trim: true },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: '', trim: true },
    rejectedAt: { type: Date, default: null },
    rejectedBy: { type: String, default: '', trim: true },
    joiningDate: { type: String, default: '' },
    kycDocuments: [kycDocumentSchema],
  },
  { timestamps: true },
);

sellerSchema.index({ approvalStatus: 1, createdAt: -1 });
sellerSchema.index({ businessName: 'text', vendorCode: 'text', email: 'text' });

const Seller = mongoose.models.Seller || mongoose.model('Seller', sellerSchema);

module.exports = Seller;
module.exports.APPROVAL_STATUSES = APPROVAL_STATUSES;
module.exports.KYC_STATUSES = KYC_STATUSES;
module.exports.VENDOR_STATUSES = VENDOR_STATUSES;
