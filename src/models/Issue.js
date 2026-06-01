const mongoose = require('mongoose');

const ISSUE_STATUSES = ['Pending', 'In Progress', 'Resolved', 'Closed'];

const issueSchema = new mongoose.Schema(
  {
    rnNumber: { type: String, trim: true, unique: true, index: true },
    customerId: { type: String, trim: true, default: '' },
    customerName: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    mobile: { type: String, trim: true, default: '' },
    article: { type: String, trim: true, default: '' },
    issueType: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    vendorName: { type: String, trim: true, default: '' },
    vendorResponse: { type: String, trim: true, default: '' },
    penaltyAmount: { type: Number, default: 0 },
    status: { type: String, enum: ISSUE_STATUSES, default: 'Pending', index: true },
    country: { type: String, trim: true, default: '' },
    raisedDate: { type: String, trim: true, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const Issue = mongoose.models.Issue || mongoose.model('Issue', issueSchema);

module.exports = Issue;
module.exports.ISSUE_STATUSES = ISSUE_STATUSES;
