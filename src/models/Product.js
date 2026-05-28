const mongoose = require('mongoose');

const STATUSES = ['pending', 'active', 'rejected'];

const productSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    moq: { type: Number, default: 1, min: 1 },
    priceMin: { type: Number, default: 0, min: 0 },
    priceMax: { type: Number, default: 0, min: 0 },
    images: [{ type: String, trim: true }],
    country: { type: String, default: '', trim: true },
    exportReady: { type: Boolean, default: false },
    status: { type: String, enum: STATUSES, default: 'pending', index: true },
    rejectionReason: { type: String, default: '', trim: true },
    approvedBy: { type: String, default: '', trim: true },
    approvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productSchema.index({ title: 'text', description: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
module.exports = Product;
module.exports.STATUSES = STATUSES;
