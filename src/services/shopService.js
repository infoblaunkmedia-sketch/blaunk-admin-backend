const Shop = require('../models/Shop');
const { SHOP_STATUSES } = require('../models/Shop');

function clean(v) {
  return String(v == null ? '' : v).trim();
}

function normalizeCategory(v) {
  return clean(v).toUpperCase();
}

function resolveImageUrl(doc) {
  return clean(doc.imageUrl) || clean(doc.coverImage);
}

function toPublicDto(doc) {
  const imageUrl = resolveImageUrl(doc);
  return {
    id: String(doc._id),
    shopName: doc.shopName || '',
    tagline: doc.tagline || '',
    category: doc.category || '',
    city: doc.city || '',
    pincode: doc.pincode || '',
    address: doc.address || '',
    promoText: doc.promoText || '',
    imageUrl,
    rating: Number(doc.rating ?? 4.9),
    isVerified: !!doc.isVerified,
    sortOrder: Number(doc.sortOrder || 0),
    linkUrl: doc.linkUrl || '',
    status: 'approved',
  };
}

function toAdminDto(doc) {
  return {
    id: String(doc._id),
    shopName: doc.shopName || '',
    ownerName: doc.ownerName || '',
    email: doc.email || '',
    phone: doc.phone || '',
    tagline: doc.tagline || '',
    category: doc.category || '',
    city: doc.city || '',
    pincode: doc.pincode || '',
    address: doc.address || '',
    promoText: doc.promoText || '',
    imageUrl: doc.imageUrl || '',
    coverImage: doc.coverImage || '',
    rating: Number(doc.rating ?? 4.9),
    isVerified: !!doc.isVerified,
    sortOrder: Number(doc.sortOrder || 0),
    linkUrl: doc.linkUrl || '',
    status: doc.status || 'pending',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function normalizeStatus(status) {
  const s = clean(status).toLowerCase();
  if (!SHOP_STATUSES.includes(s)) return null;
  return s;
}

function buildUpdates(payload, { partial = false } = {}) {
  const updates = {};
  const set = (key, val) => {
    if (partial && payload[key] === undefined) return;
    updates[key] = val;
  };

  set('shopName', clean(payload.shopName));
  set('ownerName', clean(payload.ownerName));
  set('email', clean(payload.email).toLowerCase());
  set('phone', clean(payload.phone));
  set('tagline', clean(payload.tagline));
  if (!partial || payload.category != null) {
    const cat = normalizeCategory(payload.category);
    if (cat) updates.category = cat;
  }
  set('city', clean(payload.city));
  set('pincode', clean(payload.pincode));
  set('address', clean(payload.address));
  set('promoText', clean(payload.promoText));
  if (payload.imageUrl !== undefined) updates.imageUrl = clean(payload.imageUrl);
  if (payload.coverImage !== undefined) updates.coverImage = clean(payload.coverImage);
  if (payload.rating != null) {
    const n = Number(payload.rating);
    if (Number.isFinite(n)) updates.rating = Math.min(5, Math.max(0, n));
  }
  if (payload.isVerified != null) updates.isVerified = !!payload.isVerified;
  if (payload.sortOrder != null) updates.sortOrder = Number(payload.sortOrder) || 0;
  set('linkUrl', clean(payload.linkUrl));
  if (payload.status != null) {
    const st = normalizeStatus(payload.status);
    if (st) updates.status = st;
  }
  return updates;
}

async function listPublicShops({ category } = {}) {
  const query = { status: 'approved' };
  const cat = normalizeCategory(category);
  if (cat) query.category = cat;
  const rows = await Shop.find(query).sort({ sortOrder: 1, createdAt: -1 }).lean();
  return rows.map(toPublicDto);
}

async function listShops({ status, category, q } = {}) {
  const query = {};
  const st = normalizeStatus(status);
  if (st) query.status = st;
  const cat = normalizeCategory(category);
  if (cat) query.category = cat;
  if (clean(q)) {
    const re = new RegExp(clean(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ shopName: re }, { ownerName: re }, { email: re }, { city: re }, { category: re }];
  }
  const rows = await Shop.find(query).sort({ category: 1, sortOrder: 1, createdAt: -1 }).lean();
  return rows.map(toAdminDto);
}

async function registerShop(payload) {
  const shopName = clean(payload.shopName);
  const ownerName = clean(payload.ownerName);
  const email = clean(payload.email);
  const phone = clean(payload.phone);
  const category = normalizeCategory(payload.category);
  const city = clean(payload.city);
  const pincode = clean(payload.pincode);

  if (!shopName) throw new Error('shopName is required.');
  if (!ownerName) throw new Error('ownerName is required.');
  if (!email) throw new Error('email is required.');
  if (!phone) throw new Error('phone is required.');
  if (!category) throw new Error('category is required.');
  if (!city) throw new Error('city is required.');
  if (!pincode) throw new Error('pincode is required.');

  const doc = await Shop.create({
    shopName,
    ownerName,
    email,
    phone,
    category,
    city,
    pincode,
    address: clean(payload.address),
    status: 'pending',
    rating: 4.9,
    isVerified: false,
    sortOrder: 0,
  });
  return toAdminDto(doc.toObject());
}

async function updateShop(id, payload) {
  const updates = buildUpdates(payload, { partial: true });
  if (!Object.keys(updates).length) throw new Error('No valid fields to update.');
  const doc = await Shop.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  return doc ? toAdminDto(doc) : null;
}

async function deleteShop(id) {
  const r = await Shop.findByIdAndDelete(id);
  return !!r;
}

async function ensureSeedShopsIfEmpty() {
  const count = await Shop.countDocuments();
  if (count > 0) return { seeded: 0 };

  const categories = ['PET SHOP', 'FLOWER SHOP', 'ELECTRONICS'];
  const samples = [];

  const shopDefs = [
    { shopName: 'PET PARADISE', tagline: 'PAWS & CLAWS', category: 'PET SHOP', promoText: 'Weekend Special: Extra 15% off on pet food.', sortOrder: 1 },
    { shopName: 'HAPPY TAILS', tagline: 'GROOM & CARE', category: 'PET SHOP', promoText: 'Free grooming kit on first order.', sortOrder: 2 },
    { shopName: 'BLOOM STUDIO', tagline: 'FRESH DAILY', category: 'FLOWER SHOP', promoText: 'Same-day delivery on bouquets.', sortOrder: 1 },
    { shopName: 'ROSE GARDEN', tagline: 'PREMIUM FLORALS', category: 'FLOWER SHOP', promoText: 'Buy 2 get 1 on seasonal blooms.', sortOrder: 2 },
    { shopName: 'TECH HUB LOCAL', tagline: 'GADGETS & MORE', category: 'ELECTRONICS', promoText: 'Extended warranty on all phones.', sortOrder: 1 },
    { shopName: 'SMART ZONE', tagline: 'HOME & OFFICE', category: 'ELECTRONICS', promoText: 'Free setup on smart home kits.', sortOrder: 2 },
  ];

  for (const s of shopDefs) {
    const slug = s.shopName.toLowerCase().replace(/\s+/g, '-');
    samples.push({
      ...s,
      ownerName: 'Demo Owner',
      email: `${slug}@example.com`,
      phone: '+919000000001',
      city: 'Mumbai',
      pincode: '400001',
      address: '12 Market Lane',
      imageUrl: `/uploads/shops/${slug}.jpg`,
      rating: 4.9,
      isVerified: true,
      status: 'approved',
      linkUrl: '',
    });
  }

  await Shop.insertMany(samples);
  return { seeded: samples.length };
}

module.exports = {
  listPublicShops,
  listShops,
  registerShop,
  updateShop,
  deleteShop,
  ensureSeedShopsIfEmpty,
  toPublicDto,
};
