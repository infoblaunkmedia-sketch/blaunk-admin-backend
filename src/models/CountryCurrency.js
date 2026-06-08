const mongoose = require('mongoose');

const countryCurrencySchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true, unique: true },
    currencyCode: { type: String, required: true, trim: true, uppercase: true },
    currencyName: { type: String, required: true, trim: true },
    icon: { type: String, trim: true, default: '' },
    rateToInr: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

countryCurrencySchema.index({ isActive: 1, sortOrder: 1, country: 1 });

const CountryCurrency =
  mongoose.models.CountryCurrency || mongoose.model('CountryCurrency', countryCurrencySchema);

module.exports = CountryCurrency;
