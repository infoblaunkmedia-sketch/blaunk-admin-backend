const Seller = require('../models/Seller');
const { APPROVAL_STATUSES } = require('../models/Seller');
const notificationService = require('./notificationService');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function formatDate(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}

function mapKycDoc(doc) {
  return {
    id: String(doc._id),
    docType: doc.docType || 'KYC',
    fileName: doc.fileName || '',
    originalName: doc.originalName || '',
    url: doc.url || '',
    uploadedAt: doc.uploadedAt,
    uploadedBy: doc.uploadedBy || '',
  };
}

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    vendorCode: doc.vendorCode || '',
    businessName: doc.businessName || '',
    ownerName: doc.ownerName || '',
    mobile: doc.mobile || '',
    email: doc.email || '',
    address: doc.address || '',
    city: doc.city || '',
    state: doc.state || '',
    country: doc.country || '',
    productCategories: doc.productCategories || '',
    bank: doc.bank || {},
    kycStatus: doc.kycStatus || 'Pending',
    status: doc.status || 'Active',
    approvalStatus: doc.approvalStatus || 'pending',
    rejectionReason: doc.rejectionReason || '',
    approvedAt: doc.approvedAt,
    rejectedAt: doc.rejectedAt,
    joiningDate: doc.joiningDate || formatDate(doc.createdAt),
    kycDocumentCount: Array.isArray(doc.kycDocuments) ? doc.kycDocuments.length : 0,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function normalizeApprovalStatus(status) {
  const s = cleanString(status).toLowerCase();
  if (!APPROVAL_STATUSES.includes(s)) return null;
  return s;
}

function buildSearchQuery(q) {
  const needle = cleanString(q);
  if (!needle) return {};
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { vendorCode: re },
      { businessName: re },
      { ownerName: re },
      { email: re },
      { mobile: re },
      { productCategories: re },
    ],
  };
}

async function listSellers({ q, status, page = 1, limit = 50 } = {}) {
  const query = { ...buildSearchQuery(q) };
  const approval = normalizeApprovalStatus(status);
  if (approval) query.approvalStatus = approval;

  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
  const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [records, total] = await Promise.all([
    Seller.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Seller.countDocuments(query),
  ]);

  return {
    records: records.map(toDto),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    },
  };
}

async function getSellerById(id) {
  const doc = await Seller.findById(id).lean();
  return toDto(doc);
}

async function getSellerDocuments(id) {
  const doc = await Seller.findById(id).select('kycDocuments vendorCode businessName').lean();
  if (!doc) return null;
  return {
    sellerId: String(doc._id),
    vendorCode: doc.vendorCode,
    businessName: doc.businessName,
    documents: (doc.kycDocuments || []).map(mapKycDoc),
  };
}

async function addKycDocument(sellerId, { docType, fileName, originalName, url, uploadedBy } = {}) {
  const entry = {
    docType: cleanString(docType) || 'KYC',
    fileName: cleanString(fileName),
    originalName: cleanString(originalName),
    url: cleanString(url),
    uploadedAt: new Date(),
    uploadedBy: cleanString(uploadedBy),
  };
  if (!entry.fileName || !entry.url) throw new Error('fileName and url are required.');

  const doc = await Seller.findByIdAndUpdate(
    sellerId,
    { $push: { kycDocuments: entry } },
    { returnDocument: 'after' },
  ).lean();
  if (!doc) return null;
  const added = doc.kycDocuments[doc.kycDocuments.length - 1];
  return mapKycDoc(added);
}

async function approveSeller(id, actedBy) {
  const doc = await Seller.findById(id).lean();
  if (!doc) return null;
  if (doc.approvalStatus === 'approved') {
    throw new Error('Seller is already approved.');
  }

  const actor = cleanString(actedBy) || 'admin';
  const updated = await Seller.findByIdAndUpdate(
    id,
    {
      $set: {
        approvalStatus: 'approved',
        kycStatus: 'Verified',
        status: 'Active',
        rejectionReason: '',
        approvedAt: new Date(),
        approvedBy: actor,
        rejectedAt: null,
        rejectedBy: '',
      },
    },
    { returnDocument: 'after' },
  ).lean();

  const emailResult = await notificationService.sendVendorApprovedEmail(updated);
  return { record: toDto(updated), email: emailResult };
}

async function rejectSeller(id, reason, actedBy) {
  const doc = await Seller.findById(id).lean();
  if (!doc) return null;
  const rejectionReason = cleanString(reason);
  if (!rejectionReason) throw new Error('rejection reason is required.');

  const actor = cleanString(actedBy) || 'admin';
  const updated = await Seller.findByIdAndUpdate(
    id,
    {
      $set: {
        approvalStatus: 'rejected',
        kycStatus: 'Rejected',
        status: 'Inactive',
        rejectionReason,
        rejectedAt: new Date(),
        rejectedBy: actor,
      },
    },
    { returnDocument: 'after' },
  ).lean();

  const emailResult = await notificationService.sendVendorRejectedEmail(updated, rejectionReason);
  return { record: toDto(updated), email: emailResult };
}

async function saveSeller(payload) {
  const vendorCode = cleanString(payload.vendorCode).toUpperCase();
  if (!vendorCode) throw new Error('vendorCode is required');
  if (!cleanString(payload.businessName)) throw new Error('businessName is required');

  const data = {
    vendorCode,
    businessName: cleanString(payload.businessName),
    ownerName: cleanString(payload.ownerName),
    mobile: cleanString(payload.mobile),
    email: cleanString(payload.email).toLowerCase(),
    address: cleanString(payload.address),
    city: cleanString(payload.city),
    state: cleanString(payload.state),
    country: cleanString(payload.country) || 'India',
    productCategories: cleanString(payload.productCategories),
    bank: payload.bank || {},
    kycStatus: payload.kycStatus || 'Pending',
    status: payload.status || 'Active',
    joiningDate: cleanString(payload.joiningDate) || formatDate(new Date()),
  };

  if (payload.id) {
    const updated = await Seller.findByIdAndUpdate(
      payload.id,
      { $set: data },
      { returnDocument: 'after' },
    ).lean();
    return toDto(updated);
  }

  const existing = await Seller.findOne({ vendorCode }).lean();
  if (existing) throw new Error('Vendor code already exists.');

  const created = await Seller.create({
    ...data,
    approvalStatus: payload.approvalStatus || 'pending',
  });
  return toDto(created.toObject());
}

async function deleteSellerById(id) {
  const result = await Seller.findByIdAndDelete(id);
  return !!result;
}

async function nextVendorCode() {
  const docs = await Seller.find({ vendorCode: /^VND\d+$/i }).select('vendorCode').lean();
  const max = docs.reduce((acc, d) => {
    const m = String(d.vendorCode || '').match(/^VND(\d+)$/i);
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc;
  }, 0);
  return `VND${String(max + 1).padStart(4, '0')}`;
}

async function ensureSeedSellersIfEmpty() {
  const count = await Seller.countDocuments();
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      vendorCode: 'VND0001',
      businessName: 'Spice Route Exports',
      ownerName: 'Rajesh Kumar',
      mobile: '+91 99887 76655',
      email: 'rajesh@spiceroute.example.com',
      country: 'India',
      state: 'Kerala',
      city: 'Kochi',
      productCategories: 'Store, Cake',
      approvalStatus: 'pending',
      kycStatus: 'Pending',
      joiningDate: '2026-05-01',
    },
    {
      vendorCode: 'VND0002',
      businessName: 'Gulf Tours LLC',
      ownerName: 'Fatima Al Noor',
      mobile: '+971 55 111 2233',
      email: 'fatima@gulftours.example.com',
      country: 'UAE-Dubai',
      productCategories: 'Tour',
      approvalStatus: 'approved',
      kycStatus: 'Verified',
      status: 'Active',
      approvedAt: new Date('2026-04-15'),
      approvedBy: 'admin',
      joiningDate: '2026-04-10',
    },
    {
      vendorCode: 'VND0003',
      businessName: 'QuickBake SG',
      ownerName: 'Lee Wei Ming',
      email: 'lee@quickbake.example.com',
      mobile: '+65 8123 9999',
      country: 'Singapore',
      productCategories: 'Cake',
      approvalStatus: 'rejected',
      kycStatus: 'Rejected',
      status: 'Inactive',
      rejectionReason: 'Incomplete KYC documentation',
      rejectedAt: new Date('2026-05-10'),
      rejectedBy: 'admin',
      joiningDate: '2026-05-05',
    },
  ];

  await Seller.insertMany(samples);
  return { seeded: samples.length };
}

module.exports = {
  listSellers,
  getSellerById,
  getSellerDocuments,
  addKycDocument,
  approveSeller,
  rejectSeller,
  saveSeller,
  deleteSellerById,
  nextVendorCode,
  ensureSeedSellersIfEmpty,
  toDto,
};
