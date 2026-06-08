const CountryCurrency = require('../models/CountryCurrency');

const DEFAULT_COUNTRIES = [
  {
    country: 'India',
    currencyCode: 'INR',
    currencyName: 'Indian Rupee',
    icon: '₹',
    rateToInr: 1,
    sortOrder: 0,
  },
  {
    country: 'United Arab Emirates',
    currencyCode: 'AED',
    currencyName: 'United Arab Emirates Dirham',
    icon: 'د.إ',
    rateToInr: 22.5,
    sortOrder: 1,
  },
  {
    country: 'Vietnam',
    currencyCode: 'VND',
    currencyName: 'Vietnamese Dong',
    icon: '₫',
    rateToInr: 0.0033,
    sortOrder: 2,
  },
  {
    country: 'Philippines',
    currencyCode: 'PHP',
    currencyName: 'Philippine Peso',
    icon: '₱',
    rateToInr: 1.45,
    sortOrder: 3,
  },
  {
    country: 'Thailand',
    currencyCode: 'THB',
    currencyName: 'Thai Baht',
    icon: '฿',
    rateToInr: 2.35,
    sortOrder: 4,
  },
  {
    country: 'Jordan',
    currencyCode: 'JOD',
    currencyName: 'Jordanian Dinar',
    icon: 'JD',
    rateToInr: 117,
    sortOrder: 5,
  },
  {
    country: 'Bangladesh',
    currencyCode: 'BDT',
    currencyName: 'Bangladeshi Taka',
    icon: '৳',
    rateToInr: 0.75,
    sortOrder: 6,
  },
  {
    country: 'Bahrain',
    currencyCode: 'BHD',
    currencyName: 'Bahraini Dinar',
    icon: '.د.ب',
    rateToInr: 220,
    sortOrder: 7,
  },
  {
    country: 'Sri Lanka',
    currencyCode: 'LKR',
    currencyName: 'Sri Lankan Rupee',
    icon: 'Rs',
    rateToInr: 0.28,
    sortOrder: 8,
  },
];

function serialize(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id || o.id || ''),
    country: o.country || '',
    currencyCode: o.currencyCode || '',
    currencyName: o.currencyName || '',
    icon: o.icon || '',
    rateToInr: Number(o.rateToInr || 0),
    isActive: o.isActive !== false,
    sortOrder: Number(o.sortOrder || 0),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function ensureDefaultCountries() {
  const count = await CountryCurrency.countDocuments();
  if (count > 0) return;
  await CountryCurrency.insertMany(DEFAULT_COUNTRIES);
}

async function listCountries({ activeOnly = true } = {}) {
  const filter = activeOnly ? { isActive: true } : {};
  const rows = await CountryCurrency.find(filter)
    .sort({ sortOrder: 1, country: 1 })
    .lean();
  return rows.map(serialize);
}

async function createCountry(payload) {
  const country = String(payload?.country || '').trim();
  const currencyCode = String(payload?.currencyCode || '').trim().toUpperCase();
  const currencyName = String(payload?.currencyName || '').trim();
  const icon = String(payload?.icon || '').trim();
  if (!country) throw new Error('Country is required.');
  if (!currencyCode) throw new Error('Currency code is required.');
  if (!currencyName) throw new Error('Currency name is required.');
  const doc = await CountryCurrency.create({
    country,
    currencyCode,
    currencyName,
    icon,
    rateToInr: Number(payload?.rateToInr) || 0,
    isActive: payload?.isActive !== false,
    sortOrder: Number(payload?.sortOrder) || 0,
  });
  return serialize(doc);
}

async function updateCountry(id, payload) {
  const patch = {};
  if (payload.country != null) patch.country = String(payload.country).trim();
  if (payload.currencyCode != null) patch.currencyCode = String(payload.currencyCode).trim().toUpperCase();
  if (payload.currencyName != null) patch.currencyName = String(payload.currencyName).trim();
  if (payload.icon != null) patch.icon = String(payload.icon).trim();
  if (payload.rateToInr != null) patch.rateToInr = Number(payload.rateToInr) || 0;
  if (payload.isActive != null) patch.isActive = Boolean(payload.isActive);
  if (payload.sortOrder != null) patch.sortOrder = Number(payload.sortOrder) || 0;
  const doc = await CountryCurrency.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!doc) throw new Error('Country not found.');
  return serialize(doc);
}

async function deleteCountry(id) {
  const doc = await CountryCurrency.findByIdAndDelete(id);
  if (!doc) throw new Error('Country not found.');
  return { deleted: true };
}

module.exports = {
  ensureDefaultCountries,
  listCountries,
  createCountry,
  updateCountry,
  deleteCountry,
};
