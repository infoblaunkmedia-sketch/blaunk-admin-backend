const mongoose = require('mongoose');

const SHOP_STATUSES = ['pending', 'approved', 'rejected'];

const shopSchema = new mongoose.Schema(
  {
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    tagline: { type: String, default: '', trim: true },
    category: { type: String, required: true, trim: true, uppercase: true, index: true },
    city: { type: String, default: '', trim: true },
    pincode: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    promoText: { type: String, default: '', trim: true },
    imageUrl: { type: String, default: '', trim: true },
    coverImage: { type: String, default: '', trim: true },
    rating: { type: Number, default: 4.9, min: 0, max: 5 },
    isVerified: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    linkUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: SHOP_STATUSES, default: 'pending', index: true },
  },
  { timestamps: true },
);

shopSchema.index({ status: 1, category: 1, sortOrder: 1 });

const Shop = mongoose.models.Shop || mongoose.model('Shop', shopSchema);

module.exports = Shop;
module.exports.SHOP_STATUSES = SHOP_STATUSES;
