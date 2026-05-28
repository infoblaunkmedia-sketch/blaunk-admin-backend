const Referral = require('../models/Referral');
const DsaPayout = require('../models/DsaPayout');
const { EVENT_TYPES } = require('../models/Referral');

function clean(v) { return String(v == null ? '' : v).trim(); }

function toDto(doc) {
  return {
    id: String(doc._id),
    dsaCode: doc.dsaCode,
    referredUserId: doc.referredUserId,
    referredUserName: doc.referredUserName || '',
    eventType: doc.eventType,
    commissionRate: doc.commissionRate,
    commissionAmount: doc.commissionAmount,
    payoutStatus: doc.payoutStatus,
    createdAt: doc.createdAt,
  };
}

async function trackReferral({ dsaCode, referredUserId, referredUserName, eventType, commissionRate, commissionAmount } = {}) {
  const code = clean(dsaCode).toUpperCase();
  const userId = clean(referredUserId);
  const ev = clean(eventType).toLowerCase();
  if (!code) throw new Error('dsaCode is required');
  if (!userId) throw new Error('referredUserId is required');
  if (!EVENT_TYPES.includes(ev)) throw new Error('eventType must be signup or first_order');

  const existing = await Referral.findOne({ dsaCode: code, referredUserId: userId, eventType: ev }).lean();
  if (existing) return toDto(existing);

  const rate = Number(commissionRate) || 10;
  const amount = Number(commissionAmount) || (ev === 'first_order' ? 500 : 100);
  const doc = await Referral.create({
    dsaCode: code,
    referredUserId: userId,
    referredUserName: clean(referredUserName),
    eventType: ev,
    commissionRate: rate,
    commissionAmount: amount,
    payoutStatus: 'pending',
  });
  return toDto(doc.toObject());
}

async function listReferrals({ dsaCode, page = 1, limit = 50 } = {}) {
  const query = {};
  if (clean(dsaCode)) query.dsaCode = clean(dsaCode).toUpperCase();
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 50, 1), 200);
  const safePage = Math.max(parseInt(String(page), 10) || 1, 1);
  const skip = (safePage - 1) * safeLimit;
  const [rows, total] = await Promise.all([
    Referral.find(query).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Referral.countDocuments(query),
  ]);
  return {
    records: rows.map(toDto),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.max(1, Math.ceil(total / safeLimit)) },
  };
}

async function getCommissionLedger(dsaCode) {
  const code = clean(dsaCode).toUpperCase();
  const match = code ? { dsaCode: code } : {};
  const referralAgg = await Referral.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$dsaCode',
        totalCommission: { $sum: '$commissionAmount' },
        pendingCommission: {
          $sum: { $cond: [{ $eq: ['$payoutStatus', 'pending'] }, '$commissionAmount', 0] },
        },
        referralCount: { $sum: 1 },
      },
    },
  ]);
  const payoutAgg = await DsaPayout.aggregate([
    { $match: code ? { dsaCode: code } : {} },
    {
      $group: {
        _id: '$dsaCode',
        totalSubmitted: { $sum: '$submittedAmount' },
        approvedPayouts: {
          $sum: { $cond: [{ $in: ['$status', ['APPROVED', 'Approved']] }, '$submittedAmount', 0] },
        },
      },
    },
  ]);
  const byDsa = new Map();
  referralAgg.forEach((r) => {
    byDsa.set(r._id, {
      dsaCode: r._id,
      totalCommission: r.totalCommission,
      pendingCommission: r.pendingCommission,
      referralCount: r.referralCount,
      totalSubmitted: 0,
      approvedPayouts: 0,
    });
  });
  payoutAgg.forEach((p) => {
    const row = byDsa.get(p._id) || {
      dsaCode: p._id,
      totalCommission: 0,
      pendingCommission: 0,
      referralCount: 0,
      totalSubmitted: 0,
      approvedPayouts: 0,
    };
    row.totalSubmitted = p.totalSubmitted;
    row.approvedPayouts = p.approvedPayouts;
    byDsa.set(p._id, row);
  });
  return [...byDsa.values()].sort((a, b) => a.dsaCode.localeCompare(b.dsaCode));
}

async function ensureSeedReferrals() {
  if (await Referral.countDocuments()) return { seeded: 0 };
  await Referral.insertMany([
    { dsaCode: 'DSA0001', referredUserId: 'CUST0001', referredUserName: 'Priya Sharma', eventType: 'signup', commissionRate: 10, commissionAmount: 100 },
    { dsaCode: 'DSA0001', referredUserId: 'CUST0001', referredUserName: 'Priya Sharma', eventType: 'first_order', commissionRate: 10, commissionAmount: 500 },
  ]);
  return { seeded: 2 };
}

module.exports = { trackReferral, listReferrals, getCommissionLedger, ensureSeedReferrals };
