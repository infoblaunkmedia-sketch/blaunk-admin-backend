const Category = require('../models/Category');

function clean(v) { return String(v == null ? '' : v).trim(); }
function slugify(name) {
  return clean(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
}

function toDto(doc, children = []) {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    parentId: doc.parentId ? String(doc.parentId) : null,
    image: doc.image || '',
    sortOrder: doc.sortOrder || 0,
    isActive: !!doc.isActive,
    children,
    createdAt: doc.createdAt,
  };
}

async function buildTree(flat) {
  const map = new Map();
  flat.forEach((c) => map.set(String(c._id), { ...toDto(c), children: [] }));
  const roots = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortFn = (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0);
  const sortRec = (nodes) => {
    nodes.sort(sortFn);
    nodes.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

async function listCategoriesTree() {
  const flat = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
  return buildTree(flat);
}

async function listPublicCategories() {
  const flat = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();
  return buildTree(flat);
}

async function createCategory(payload) {
  const name = clean(payload.name);
  if (!name) throw new Error('name is required');
  let slug = clean(payload.slug) || slugify(name);
  const exists = await Category.findOne({ slug }).lean();
  if (exists) slug = `${slug}-${Date.now()}`;
  const doc = await Category.create({
    name,
    slug,
    parentId: payload.parentId || null,
    image: clean(payload.image),
    sortOrder: Number(payload.sortOrder) || 0,
    isActive: payload.isActive !== false,
  });
  return toDto(doc.toObject());
}

async function updateCategory(id, payload) {
  const updates = {};
  if (payload.name != null) updates.name = clean(payload.name);
  if (payload.slug != null) updates.slug = slugify(payload.slug);
  if (payload.parentId !== undefined) updates.parentId = payload.parentId || null;
  if (payload.image != null) updates.image = clean(payload.image);
  if (payload.sortOrder != null) updates.sortOrder = Number(payload.sortOrder) || 0;
  if (payload.isActive != null) updates.isActive = !!payload.isActive;
  const doc = await Category.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  return doc ? toDto(doc) : null;
}

async function deleteCategory(id) {
  const children = await Category.countDocuments({ parentId: id });
  if (children > 0) throw new Error('Cannot delete category with subcategories');
  const r = await Category.findByIdAndDelete(id);
  return !!r;
}

async function ensureSeedCategories() {
  if (await Category.countDocuments()) return { seeded: 0 };
  const tour = await Category.create({ name: 'Tour Packages', slug: 'tour-packages', sortOrder: 1 });
  await Category.insertMany([
    { name: 'Store', slug: 'store', sortOrder: 2 },
    { name: 'Cake & Bakery', slug: 'cake-bakery', sortOrder: 3 },
    { name: 'Domestic Tours', slug: 'domestic-tours', parentId: tour._id, sortOrder: 1 },
    { name: 'International Tours', slug: 'international-tours', parentId: tour._id, sortOrder: 2 },
  ]);
  return { seeded: 5 };
}

module.exports = {
  listCategoriesTree, listPublicCategories, createCategory, updateCategory, deleteCategory, ensureSeedCategories,
};
