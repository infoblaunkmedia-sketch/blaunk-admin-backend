const mongoose = require('mongoose');

const REVIEW_STATUSES = ['Published', 'Hidden', 'Flagged'];

const reviewSchema = new mongoose.Schema(
  {
    reviewId: { type: String, trim: true, unique: true, sparse: true },
    vendorId: { type: String, trim: true, default: '' },
    customerId: { type: String, trim: true, default: '' },
    reviewerName: { type: String, trim: true, default: '' },
    product: { type: String, trim: true, default: '' },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    reviewText: { type: String, trim: true, default: '' },
    status: { type: String, enum: REVIEW_STATUSES, default: 'Published', index: true },
    reviewDate: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

module.exports = Review;
module.exports.REVIEW_STATUSES = REVIEW_STATUSES;
