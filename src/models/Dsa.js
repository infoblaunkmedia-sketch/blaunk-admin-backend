const mongoose = require('mongoose');

const DSA_TYPES = ['admin', 'website'];

const dsaSchema = new mongoose.Schema(
  {
    dsaCode: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
    /** admin = admin panel DSA (3P employee); website = frontend-only DSA */
    dsaType: { type: String, enum: DSA_TYPES, default: 'website', index: true },
    name: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    status: { type: String, trim: true, default: 'Active' },
  },
  { timestamps: true },
);

dsaSchema.index({ dsaType: 1, dsaCode: 1 });

const Dsa = mongoose.models.Dsa || mongoose.model('Dsa', dsaSchema);

module.exports = Dsa;
module.exports.DSA_TYPES = DSA_TYPES;
