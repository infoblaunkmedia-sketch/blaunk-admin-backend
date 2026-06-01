const Giff = require('../models/Giff');
const {
  GIFF_CATEGORIES,
  GIFF_FORMATS,
  getGiffCategory,
  maxRecordsForCategory,
  assertGiffCategory,
} = require('../constants/giffCategories');

function clean(v) {
  return String(v == null ? '' : v).trim();
}

function normalizeFormat(raw) {
  const v = clean(raw).toLowerCase();
  if (v === 'jpeg') return 'jpg';
  if (v === 'jpg' || v === 'gif') return v;
  return 'gif';
}

function normalizeSortOrder(sortOrder) {
  const n = Number(sortOrder);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function toAdminDto(doc) {
  const category = clean(doc.category).toLowerCase();
  const meta = getGiffCategory(category);
  const sortOrder = normalizeSortOrder(doc.sortOrder);
  return {
    id: String(doc._id),
    category,
    categoryLabel: meta?.label || category,
    sortOrder,
    slotKey: sortOrder === 2 ? 'right' : 'left',
    imageUrl: doc.imageUrl || '',
    format: normalizeFormat(doc.format),
    isActive: !!doc.isActive,
  };
}

function toPublicDto(doc) {
  const category = clean(doc.category).toLowerCase();
  const dto = {
    id: String(doc._id),
    category,
    sortOrder: normalizeSortOrder(doc.sortOrder),
    imageUrl: doc.imageUrl || '',
    format: normalizeFormat(doc.format),
    isActive: !!doc.isActive,
  };
  const productId = clean(doc.productId);
  if (productId) dto.productId = productId;
  return dto;
}

function isActiveNow(doc) {
  return !!doc.isActive;
}

function buildPayload(body, { partial = false } = {}) {
  const updates = {};
  const set = (key, value) => {
    if (partial && body[key] === undefined) return;
    updates[key] = value;
  };

  if (!partial || body.category != null) {
    updates.category = assertGiffCategory(body.category);
  }
  if (!partial || body.imageUrl != null) set('imageUrl', clean(body.imageUrl));
  if (!partial || body.format != null || body.variant != null) {
    set('format', normalizeFormat(body.format ?? body.variant));
  }
  if (!partial || body.isActive != null) set('isActive', body.isActive !== false);
  if (!partial || body.sortOrder != null) {
    updates.sortOrder = normalizeSortOrder(body.sortOrder);
  }
  if (!partial || body.productId != null) {
    set('productId', clean(body.productId));
  }

  return updates;
}

async function listGiffs({ category } = {}) {
  const query = {};
  const cat = clean(category).toLowerCase();
  if (cat) query.category = assertGiffCategory(cat);

  const rows = await Giff.find(query).sort({ category: 1, sortOrder: 1, createdAt: -1 }).lean();
  const records = rows.map(toAdminDto);

  if (cat) {
    const meta = getGiffCategory(cat);
    return {
      category: cat,
      categoryLabel: meta?.label || cat,
      maxRecords: meta?.maxRecords ?? null,
      records,
    };
  }

  return { records, categories: GIFF_CATEGORIES };
}

async function listPublicGiffs({ category } = {}) {
  const query = {};
  const cat = clean(category).toLowerCase();
  if (cat) query.category = assertGiffCategory(cat);

  const rows = await Giff.find(query).sort({ category: 1, sortOrder: 1 }).lean();
  const records = rows.filter(isActiveNow).map(toPublicDto);
  return { records };
}

async function createGiff(body) {
  const data = buildPayload(body);
  const category = data.category || assertGiffCategory(body.category);
  data.category = category;

  if (!clean(data.imageUrl)) throw new Error('imageUrl is required.');

  const format = normalizeFormat(data.format);
  if (!GIFF_FORMATS.has(format)) throw new Error('format must be gif or jpg.');
  data.format = format;

  const max = maxRecordsForCategory(category);
  if (max != null) {
    const count = await Giff.countDocuments({ category });
    if (count >= max) {
      throw new Error(`Maximum ${max} upload(s) allowed for this category.`);
    }
  }

  const doc = await Giff.create(data);
  return toAdminDto(doc.toObject());
}

async function updateGiff(id, body) {
  const existing = await Giff.findById(id).lean();
  if (!existing) return null;

  const updates = buildPayload(body, { partial: true });
  if (updates.format != null && !GIFF_FORMATS.has(updates.format)) {
    throw new Error('format must be gif or jpg.');
  }
  if (body.imageUrl !== undefined && !clean(updates.imageUrl ?? body.imageUrl)) {
    throw new Error('imageUrl is required.');
  }

  const doc = await Giff.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  return doc ? toAdminDto(doc) : null;
}

async function deleteGiff(id) {
  const r = await Giff.findByIdAndDelete(id);
  return !!r;
}

async function ensureBgtViewMoreGiffBanners() {
  const count = await Giff.countDocuments({ category: 'bgt-view-more-giff' });
  if (count > 0) return { seeded: 0 };

  const samples = [1, 2].map((n) => ({
    category: 'bgt-view-more-giff',
    imageUrl: `/uploads/bgt-view-more-giff-${n}.jpg`,
    format: 'jpg',
    sortOrder: n,
    isActive: true,
  }));

  await Giff.insertMany(samples);
  return { seeded: samples.length };
}

module.exports = {
  listGiffs,
  listPublicGiffs,
  createGiff,
  updateGiff,
  deleteGiff,
  ensureBgtViewMoreGiffBanners,
  GIFF_CATEGORIES,
};
