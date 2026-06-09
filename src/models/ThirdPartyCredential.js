const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    designation: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const thirdPartyCredentialSchema = new mongoose.Schema(
  {
    // Match the UI form (3P-Credentials) fields.
    department: { type: String, trim: true, default: '' },
    name: { type: String, trim: true, required: true },
    aadharNo: { type: String, trim: true, default: '' },
    mobileNo: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    panNo: { type: String, trim: true, default: '' },
    tanNo: { type: String, trim: true, default: '' },
    passportNo: { type: String, trim: true, default: '' },
    gender: { type: String, trim: true, default: '' },
    address1: { type: String, trim: true, default: '' },
    address2: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    zip: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    threePCompanyName: { type: String, trim: true, default: '' },
    threePEmplCode: { type: String, trim: true, default: '' }, // This is the 3PC login code
    /** Mirrors active Settings → Match Code (shared by all 3P employees). */
    matchCode: { type: String, trim: true, default: null },
    threePEntity: { type: String, trim: true, default: '' },
    businessCode: { type: String, trim: true, default: '' },
    branchCode: { type: String, trim: true, default: '' },
    gstTaxNo: { type: String, trim: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, default: '' },
    bankAccountNumber: { type: String, trim: true, default: '' },
    bankCity: { type: String, trim: true, default: '' },
    bankCountry: { type: String, trim: true, default: '' },
    swiftNo: { type: String, trim: true, default: '' },
    ibanNo: { type: String, trim: true, default: '' },
    doj: { type: String, trim: true, default: '' },
    ira: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: '' },
    exitDate: { type: String, trim: true, default: '' },
    verifiedStatus: { type: String, trim: true, default: '' },
    businessDeposit: { type: String, trim: true, default: '' },
    sharingThreeP: { type: String, trim: true, default: '' },
    sharingBlaunk: { type: String, trim: true, default: '' },
    commissionSubscriber: { type: String, trim: true, default: '' },
    commissionRenewal: { type: String, trim: true, default: '' },

    // References + document images (URLs to /uploads)
    references: { type: [referenceSchema], default: [] },
    employeePhotoUrl: { type: String, trim: true, default: '' },
    profileImageUrl: { type: String, trim: true, default: '' },
    chqImageUrl: { type: String, trim: true, default: '' },
    panImageUrl: { type: String, trim: true, default: '' },

    // Legacy fields from earlier lightweight 3P credentials page
    username: { type: String, trim: true, default: '' },
    password: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

thirdPartyCredentialSchema.index({ name: 1 });
thirdPartyCredentialSchema.index({ department: 1 });
thirdPartyCredentialSchema.index({ threePEmplCode: 1 });
thirdPartyCredentialSchema.index({ matchCode: 1 });

const ThirdPartyCredential =
  mongoose.models.ThirdPartyCredential ||
  mongoose.model('ThirdPartyCredential', thirdPartyCredentialSchema);

module.exports = ThirdPartyCredential;

