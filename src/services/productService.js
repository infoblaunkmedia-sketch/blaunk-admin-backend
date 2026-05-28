const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { STATUSES } = require('../models/Product');

function clean(v) { return String(v == null ? '' : v).trim(); }

function toDto(doc, seller) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    sellerId: String(doc.sellerId),
    sellerName: seller?.businessName || seller?.vendorCode || '',
    categoryId: doc.categoryId ? String(doc.categoryId) : '',
    title: doc.title,
    description: doc.description || '',
    moq: doc.moq,
    priceMin: doc.priceMin,
    priceMax: doc.priceMax,
    images: doc.images || [],
    country: doc.country || '',
    exportReady: !!doc.exportReady,
    status: doc.status,
    rejectionReason: doc.rejectionReason || '',
    approvedBy: doc.approvedBy || '',
    approvedAt: doc.approvedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function enrichSeller(doc) {
  const seller = await Seller.findById(doc.sellerId).select('businessName vendorCode').lean();
  return toDto(doc, seller);
}

async function listProducts({ status, q, sellerId, page = 1, limit = 20 } = {}) {
  const query = {};
  if (status && STATUSES.includes(status)) query.status = status;
  if (sellerId) query.sellerId = sellerId;
  const needle = clean(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: re }, { description: re }, { country: re }];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;
  const [rows, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Product.countDocuments(query),
  ]);
  const records = await Promise.all(rows.map((r) => enrichSeller(r)));
  return { records, pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) } };
}

async function listPublicProducts({ limit = 50 } = {}) {
  const now = new Date();
  const rows = await Product.find({ status: 'active' }).sort({ createdAt: -1 }).limit(Math.min(limit, 100)).lean();
  return Promise.all(rows.map((r) => enrichSeller(r)));
}

async function createProduct(payload) {
  const sellerId = payload.sellerId;
  if (!sellerId) throw new Error('sellerId is required');
  const title = clean(payload.title);
  if (!title) throw new Error('title is required');
  const doc = await Product.create({
    sellerId,
    categoryId: payload.categoryId || null,
    title,
    description: clean(payload.description),
    moq: Math.max(1, Number(payload.moq) || 1),
    priceMin: Math.max(0, Number(payload.priceMin) || 0),
    priceMax: Math.max(0, Number(payload.priceMax) || 0),
    images: Array.isArray(payload.images) ? payload.images.map(clean).filter(Boolean) : [],
    country: clean(payload.country),
    exportReady: !!payload.exportReady,
    status: 'pending',
  });
  return enrichSeller(doc.toObject());
}

async function updateProductStatus(id, { status, rejectionReason, approvedBy } = {}) {
  const s = clean(status).toLowerCase();
  if (!STATUSES.includes(s)) throw new Error('status must be pending, active, or rejected');
  const updates = { status: s };
  if (s === 'rejected') {
    updates.rejectionReason = clean(rejectionReason);
    if (!updates.rejectionReason) throw new Error('rejectionReason is required when rejecting');
    updates.approvedBy = '';
    updates.approvedAt = null;
  } else if (s === 'active') {
    updates.rejectionReason = '';
    updates.approvedBy = clean(approvedBy);
    updates.approvedAt = new Date();
  } else {
    updates.rejectionReason = '';
    updates.approvedBy = '';
    updates.approvedAt = null;
  }
  const doc = await Product.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  return doc ? enrichSeller(doc) : null;
}

async function ensureSeedProducts() {
  if (await Product.countDocuments()) return { seeded: 0 };
  const seller = await Seller.findOne({ approvalStatus: 'approved' }).lean();
  if (!seller) return { seeded: 0 };
  const Category = require('../models/Category');
  const cat = await Category.findOne().lean();
  await Product.insertMany([
    { sellerId: seller._id, categoryId: cat?._id, title: 'Organic Spice Mix', description: 'Premium blend', moq: 10, priceMin: 500, priceMax: 800, country: 'India', status: 'pending', images: [] },
    { sellerId: seller._id, categoryId: cat?._id, title: 'Dubai Tour Package', description: '5N/6D', moq: 1, priceMin: 45000, priceMax: 65000, country: 'UAE-Dubai', exportReady: true, status: 'active', approvedBy: 'admin', approvedAt: new Date(), images: [] },
  ]);
  return { seeded: 2 };
}

module.exports = { listProducts, listPublicProducts, createProduct, updateProductStatus, ensureSeedProducts };
