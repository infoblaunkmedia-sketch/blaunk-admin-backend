const IndividualCustomer = require('../models/IndividualCustomer');
const { ACCOUNT_STATUSES } = require('../models/IndividualCustomer');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function formatDate(d) {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString().slice(0, 10);
}

function toDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    customerId: doc.customerId || '',
    fullName: doc.fullName || '',
    email: doc.email || '',
    mobile: doc.mobile || '',
    country: doc.country || '',
    registrationDate: formatDate(doc.createdAt),
    accountStatus: doc.accountStatus || 'Active',
    lastLoginDate: formatDate(doc.lastLoginDate),
    totalOrders: Number(doc.totalOrders || 0),
    internalNotes: doc.internalNotes || '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function normalizeStatus(status) {
  const s = cleanString(status);
  if (!ACCOUNT_STATUSES.includes(s)) return null;
  return s;
}

function buildSearchQuery(q) {
  const needle = cleanString(q);
  if (!needle) return {};
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return {
    $or: [
      { customerId: re },
      { fullName: re },
      { email: re },
      { mobile: re },
      { country: re },
    ],
  };
}

async function listIndividuals({ q, status, page = 1, limit = 20 } = {}) {
  const query = { ...buildSearchQuery(q) };
  const statusNorm = normalizeStatus(status);
  if (statusNorm) query.accountStatus = statusNorm;

  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;

  const [records, total] = await Promise.all([
    IndividualCustomer.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    IndividualCustomer.countDocuments(query),
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

async function getIndividualById(id) {
  const doc = await IndividualCustomer.findById(id).lean();
  return toDto(doc);
}

async function updateIndividualStatus(id, { accountStatus, internalNotes } = {}) {
  const updates = {};
  const statusNorm = accountStatus != null ? normalizeStatus(accountStatus) : null;
  if (accountStatus != null && !statusNorm) {
    throw new Error('accountStatus must be Active, Suspended, or Blocked.');
  }
  if (statusNorm) updates.accountStatus = statusNorm;
  if (internalNotes !== undefined) {
    updates.internalNotes = cleanString(internalNotes);
  }
  if (!Object.keys(updates).length) {
    throw new Error('No valid fields to update.');
  }

  const doc = await IndividualCustomer.findByIdAndUpdate(
    id,
    { $set: updates },
    { returnDocument: 'after' },
  ).lean();
  return toDto(doc);
}

async function ensureSeedIndividualsIfEmpty() {
  const count = await IndividualCustomer.countDocuments();
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      customerId: 'CUST0001',
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      mobile: '+91 98765 43210',
      country: 'India',
      accountStatus: 'Active',
      lastLoginDate: new Date('2026-05-20'),
      totalOrders: 12,
      internalNotes: '',
    },
    {
      customerId: 'CUST0002',
      fullName: 'Ahmed Al-Rashid',
      email: 'ahmed.rashid@example.com',
      mobile: '+971 50 123 4567',
      country: 'UAE-Dubai',
      accountStatus: 'Active',
      lastLoginDate: new Date('2026-05-18'),
      totalOrders: 5,
      internalNotes: 'VIP buyer — BGT vertical',
    },
    {
      customerId: 'CUST0003',
      fullName: 'John Tan',
      email: 'john.tan@example.com',
      mobile: '+65 9123 4567',
      country: 'Singapore',
      accountStatus: 'Suspended',
      lastLoginDate: new Date('2026-04-02'),
      totalOrders: 2,
      internalNotes: 'Payment dispute under review',
    },
  ];

  await IndividualCustomer.insertMany(samples);
  return { seeded: samples.length };
}

module.exports = {
  listIndividuals,
  getIndividualById,
  updateIndividualStatus,
  ensureSeedIndividualsIfEmpty,
  toDto,
};
