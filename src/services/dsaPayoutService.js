const DsaPayout = require('../models/DsaPayout');
const dsaLimitService = require('./dsaLimitService');
const { STATUS, normalizePayoutStatus, isNegativeStatus } = require('../constants/payoutStatus');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function asNonNegativeNumber(v, field) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw new Error(`${field} must be a non-negative number`);
  return Number(n.toFixed(2));
}

function normalizeCreatePayload(payload) {
  const dsaCode = cleanString(payload?.dsaCode).toUpperCase();
  if (!dsaCode) throw new Error('dsaCode is required');
  const submittedAmount = asNonNegativeNumber(payload?.submittedAmount ?? 0, 'submittedAmount');
  if (submittedAmount <= 0) throw new Error('submittedAmount must be greater than 0');
  const currencyInr = asNonNegativeNumber(payload?.currencyInr ?? 0, 'currencyInr');
  const calculatedLimit = asNonNegativeNumber(payload?.calculatedLimit ?? 0, 'calculatedLimit');
  const shareRatioRaw = Number(payload?.shareRatio ?? 30);
  const shareRatio = Number.isFinite(shareRatioRaw) ? Math.max(0, Math.min(100, shareRatioRaw)) : 30;

  return {
    dsaCode,
    dsaName: cleanString(payload?.dsaName),
    country: cleanString(payload?.country),
    submittedAmount,
    currency: cleanString(payload?.currency || 'INR') || 'INR',
    currencyInr,
    shareRatio,
    calculatedLimit,
    mode: cleanString(payload?.mode || 'NEFT') || 'NEFT',
    transactionNumber: cleanString(payload?.transactionNumber),
    submissionDate: cleanString(payload?.submissionDate),
    status: STATUS.PENDING,
    newAmount: asNonNegativeNumber(payload?.newAmount ?? 0, 'newAmount'),
    bodBalance: asNonNegativeNumber(payload?.bodBalance ?? 0, 'bodBalance'),
    usedValue: asNonNegativeNumber(payload?.usedValue ?? 0, 'usedValue'),
    availableBalance: 0,
  };
}

function statusQueryValue(statusFilter) {
  const raw = cleanString(statusFilter).toUpperCase();
  if (!raw) return null;
  const norm = normalizePayoutStatus(raw);
  if (!norm) return raw;
  if (norm === STATUS.PENDING) {
    return { $in: [STATUS.PENDING, STATUS.PENDING_LEGACY] };
  }
  return norm;
}

async function listPayouts({ dsaCode, status, limit = 500 } = {}) {
  const query = {};
  if (cleanString(dsaCode)) query.dsaCode = cleanString(dsaCode).toUpperCase();
  const statusVal = statusQueryValue(status);
  if (statusVal) {
    query.status = typeof statusVal === 'string' ? statusVal : statusVal;
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 500, 1), 2000);
  return (await DsaPayout.find(query).sort({ createdAt: -1 }).limit(safeLimit).lean()) || [];
}

async function createPayout(payload) {
  const data = normalizeCreatePayload(payload);
  const doc = await DsaPayout.create(data);
  return doc.toObject();
}

async function updatePayoutStatusById(id, statusInput, note, actedBy) {
  const status = normalizePayoutStatus(statusInput);
  if (!status) throw new Error('status is invalid');

  const rec = await DsaPayout.findById(id).lean();
  if (!rec) return null;

  const actor = cleanString(actedBy);
  const noteText = cleanString(note);
  const patch = { status };

  if (status === STATUS.APPROVED) {
    const availableBalance = Number(
      ((Number(rec.newAmount || 0) + Number(rec.bodBalance || 0) - Number(rec.usedValue || 0))).toFixed(2),
    );
    Object.assign(patch, {
      approvalNote: noteText,
      rejectionReason: '',
      approvedBy: actor,
      approvedAt: new Date(),
      rejectedBy: '',
      rejectedAt: null,
      availableBalance: Math.max(0, availableBalance),
    });
  } else if (isNegativeStatus(status)) {
    Object.assign(patch, {
      rejectionReason: noteText,
      approvalNote: '',
      rejectedBy: actor,
      rejectedAt: new Date(),
      approvedBy: '',
      approvedAt: null,
      availableBalance: 0,
    });
  } else {
    Object.assign(patch, {
      approvalNote: noteText,
      rejectionReason: '',
      approvedBy: '',
      approvedAt: null,
      rejectedBy: '',
      rejectedAt: null,
      availableBalance: 0,
    });
  }

  return DsaPayout.findOneAndUpdate(
    { _id: id },
    { $set: patch },
    { returnDocument: 'after' },
  ).lean().then(async (updated) => {
    if (updated && status === STATUS.APPROVED) {
      await dsaLimitService.syncFromApprovedPayout(updated);
    }
    return updated;
  });
}

async function approvePayoutById(id, note, actedBy) {
  return updatePayoutStatusById(id, STATUS.APPROVED, note, actedBy);
}

async function rejectPayoutById(id, reason, actedBy) {
  return updatePayoutStatusById(id, STATUS.REJECTED, reason, actedBy);
}

async function getApprovedAvailableBalanceForDsa(dsaCode) {
  const code = cleanString(dsaCode).toUpperCase();
  if (!code) return 0;
  const rows = await DsaPayout.find({ dsaCode: code, status: STATUS.APPROVED })
    .select('availableBalance')
    .lean();
  const total = (rows || []).reduce((sum, r) => sum + Number(r.availableBalance || 0), 0);
  return Number(total.toFixed(2));
}

module.exports = {
  STATUS,
  listPayouts,
  createPayout,
  updatePayoutStatusById,
  approvePayoutById,
  rejectPayoutById,
  getApprovedAvailableBalanceForDsa,
};
