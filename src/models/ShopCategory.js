const mongoose = require('mongoose');

const shopCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, uppercase: true, unique: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

shopCategorySchema.index({ isActive: 1, sortOrder: 1 });

const ShopCategory =
  mongoose.models.ShopCategory || mongoose.model('ShopCategory', shopCategorySchema);

module.exports = ShopCategory;
