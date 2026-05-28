const ShopCategory = require('../models/ShopCategory');

function clean(v) {
  return String(v == null ? '' : v).trim();
}

function normalizeName(name) {
  return clean(name).toUpperCase();
}

function toDto(doc) {
  return {
    id: String(doc._id),
    name: doc.name || '',
    sortOrder: Number(doc.sortOrder || 0),
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function listPublicCategories() {
  const rows = await ShopCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return rows.map(toDto);
}

async function listCategories() {
  const rows = await ShopCategory.find().sort({ sortOrder: 1, name: 1 }).lean();
  return rows.map(toDto);
}

async function createCategory(payload) {
  const name = normalizeName(payload.name);
  if (!name) throw new Error('name is required.');
  const doc = await ShopCategory.create({
    name,
    sortOrder: Number(payload.sortOrder) || 0,
    isActive: payload.isActive !== false,
  });
  return toDto(doc.toObject());
}

async function updateCategory(id, payload) {
  const updates = {};
  if (payload.name != null) {
    const name = normalizeName(payload.name);
    if (!name) throw new Error('name is required.');
    updates.name = name;
  }
  if (payload.sortOrder != null) updates.sortOrder = Number(payload.sortOrder) || 0;
  if (payload.isActive != null) updates.isActive = !!payload.isActive;
  if (!Object.keys(updates).length) throw new Error('No valid fields to update.');
  const doc = await ShopCategory.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  return doc ? toDto(doc) : null;
}

async function deleteCategory(id) {
  const r = await ShopCategory.findByIdAndDelete(id);
  return !!r;
}

async function ensureSeedCategoriesIfEmpty() {
  const count = await ShopCategory.countDocuments();
  if (count > 0) return { seeded: 0 };
  const rows = [
    { name: 'PET SHOP', sortOrder: 1, isActive: true },
    { name: 'FLOWER SHOP', sortOrder: 2, isActive: true },
    { name: 'ELECTRONICS', sortOrder: 3, isActive: true },
  ];
  await ShopCategory.insertMany(rows);
  return { seeded: rows.length };
}

module.exports = {
  listPublicCategories,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  ensureSeedCategoriesIfEmpty,
};
