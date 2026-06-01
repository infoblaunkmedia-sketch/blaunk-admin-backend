const Verifier = require('../models/Verifier');
const Seller = require('../models/Seller');
const { FIELD_STATUSES } = require('../models/Verifier');

const FIELD_KEYS = [
  'emailStatus',
  'mobileStatus',
  'photoStatus',
  'bankStatus',
  'shopLocationStatus',
];

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function normalizeFieldStatus(value, fallback = 'Pending') {
  const s = cleanString(value);
  return FIELD_STATUSES.includes(s) ? s : fallback;
}

function computeOverallStatus(record) {
  const statuses = FIELD_KEYS.map((k) => normalizeFieldStatus(record[k]));
  if (statuses.every((s) => s === 'Verified')) return 'Verified';
  if (statuses.some((s) => s === 'Rejected')) return 'Rejected';
  return 'Pending';
}

function toDto(doc, vendor) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    vendorId: String(doc.vendorId),
    vendorCode: vendor?.vendorCode || '',
    businessName: vendor?.businessName || '',
    ownerName: vendor?.ownerName || '',
    email: vendor?.email || '',
    mobile: vendor?.mobile || '',
    city: vendor?.city || '',
    state: vendor?.state || '',
    emailStatus: normalizeFieldStatus(doc.emailStatus),
    mobileStatus: normalizeFieldStatus(doc.mobileStatus),
    photoStatus: normalizeFieldStatus(doc.photoStatus),
    bankStatus: normalizeFieldStatus(doc.bankStatus),
    shopLocationStatus: normalizeFieldStatus(doc.shopLocationStatus),
    submittedBy: cleanString(doc.submittedBy),
    reviewedBy: cleanString(doc.reviewedBy),
    overallStatus: normalizeFieldStatus(doc.overallStatus),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function ensureForVendor(vendorId) {
  const id = String(vendorId || '');
  if (!id) return null;
  const existing = await Verifier.findOne({ vendorId: id }).lean();
  if (existing) return existing;
  const created = await Verifier.create({ vendorId: id });
  return created.toObject();
}

async function syncVerificationsForSellers() {
  const sellers = await Seller.find({ status: { $ne: 'Deleted' } }).select('_id').lean();
  await Promise.all(sellers.map((s) => ensureForVendor(s._id)));
}

async function listVerifications({ q } = {}) {
  await syncVerificationsForSellers();

  const verifications = await Verifier.find({}).sort({ updatedAt: -1 }).lean();
  const vendorIds = verifications.map((v) => v.vendorId);
  const vendors = await Seller.find({ _id: { $in: vendorIds } }).lean();
  const vendorById = new Map(vendors.map((v) => [String(v._id), v]));

  let rows = verifications.map((v) => toDto(v, vendorById.get(String(v.vendorId))));

  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    rows = rows.filter(
      (r) =>
        re.test(r.vendorCode) ||
        re.test(r.businessName) ||
        re.test(r.email) ||
        re.test(r.mobile),
    );
  }

  return rows;
}

async function getByVendorId(vendorId) {
  const vendor = await Seller.findById(vendorId).lean();
  if (!vendor) return null;
  const doc = await ensureForVendor(vendorId);
  return toDto(doc, vendor);
}

async function submitVerification(vendorId, submittedBy) {
  const vendor = await Seller.findById(vendorId).lean();
  if (!vendor) throw new Error('Vendor not found.');

  const actor = cleanString(submittedBy);
  if (!actor) throw new Error('submittedBy is required.');

  const doc = await ensureForVendor(vendorId);
  const overallStatus = computeOverallStatus(doc);

  const updated = await Verifier.findOneAndUpdate(
    { vendorId },
    {
      $set: {
        submittedBy: actor,
        overallStatus: overallStatus === 'Verified' ? 'Verified' : 'Pending',
      },
    },
    { returnDocument: 'after' },
  ).lean();

  return toDto(updated, vendor);
}

async function reviewVerification(vendorId, payload, reviewedBy) {
  const vendor = await Seller.findById(vendorId).lean();
  if (!vendor) throw new Error('Vendor not found.');

  const actor = cleanString(reviewedBy);
  if (!actor) throw new Error('reviewedBy is required.');

  const existing = await ensureForVendor(vendorId);
  const set = {
    emailStatus: normalizeFieldStatus(payload.emailStatus ?? existing.emailStatus),
    mobileStatus: normalizeFieldStatus(payload.mobileStatus ?? existing.mobileStatus),
    photoStatus: normalizeFieldStatus(payload.photoStatus ?? existing.photoStatus),
    bankStatus: normalizeFieldStatus(payload.bankStatus ?? existing.bankStatus),
    shopLocationStatus: normalizeFieldStatus(
      payload.shopLocationStatus ?? existing.shopLocationStatus,
    ),
    reviewedBy: actor,
  };
  set.overallStatus = computeOverallStatus(set);

  const updated = await Verifier.findOneAndUpdate(
    { vendorId },
    { $set: set },
    { returnDocument: 'after' },
  ).lean();

  return toDto(updated, vendor);
}

module.exports = {
  listVerifications,
  getByVendorId,
  submitVerification,
  reviewVerification,
  ensureForVendor,
  syncVerificationsForSellers,
};
