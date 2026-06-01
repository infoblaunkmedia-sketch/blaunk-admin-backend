const Review = require('../models/Review');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    reviewerName: doc.reviewerName || '',
    product: doc.product || '',
    rating: Number(doc.rating || 0),
    reviewText: doc.reviewText || '',
    date: doc.reviewDate || (doc.createdAt ? new Date(doc.createdAt).toISOString().slice(0, 10) : ''),
    status: doc.status || 'Published',
    vendorId: doc.vendorId || '',
    customerId: doc.customerId || '',
  };
}

async function listReviews({ status, vendorId, rating, q, fromDate, toDate, limit = 500 } = {}) {
  const query = {};
  if (status) query.status = status;
  if (vendorId) query.vendorId = vendorId;
  if (rating) query.rating = Number(rating);
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime())) {
      query.createdAt = { $gte: from, $lte: to };
    }
  }
  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ reviewerName: re }, { product: re }, { reviewText: re }];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 2000);
  const rows = await Review.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean();
  return rows.map(toDto);
}

async function getReviewById(id) {
  return toDto(await Review.findById(id).lean());
}

async function patchReviewStatus(id, status) {
  const next = cleanString(status);
  if (!next) throw new Error('status is required.');
  const doc = await Review.findByIdAndUpdate(
    id,
    { $set: { status: next } },
    { returnDocument: 'after' },
  ).lean();
  if (!doc) return null;
  return toDto(doc);
}

async function deleteReviewById(id) {
  const res = await Review.deleteOne({ _id: id });
  return res.deletedCount || 0;
}

module.exports = {
  listReviews,
  getReviewById,
  patchReviewStatus,
  deleteReviewById,
};
