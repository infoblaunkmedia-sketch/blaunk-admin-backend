const DsaPayout = require('../models/DsaPayout');
const dsaLimitService = require('./dsaLimitService');
const {
  STATUS,
  normalizePayoutStatus,
  isNegativeStatus,
  isValidPayoutRemark,
} = require('../constants/payoutStatus');

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
  const shareRatioRaw = Number(payload?.shareRatio ?? 30);
  const shareRatio = Number.isFinite(shareRatioRaw) ? Math.max(0, Math.min(100, shareRatioRaw)) : 30;

  return {
    dsaCode,
    dsaName: cleanString(payload?.dsaName),
    country: cleanString(payload?.country),
    submittedAmount,
    currency: cleanString(payload?.currency || 'INR') || 'INR',
    currencyInr: null,
    shareRatio,
    calculatedLimit: null,
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

async function latestApprovedLimitForDsa(dsaCode, excludeId) {
  const code = cleanString(dsaCode).toUpperCase();
  if (!code) return 0;
  const query = { dsaCode: code, status: STATUS.APPROVED, calculatedLimit: { $gt: 0 } };
  if (excludeId) query._id = { $ne: excludeId };
  const latest = await DsaPayout.findOne(query)
    .sort({ approvedAt: -1, updatedAt: -1 })
    .select('calculatedLimit')
    .lean();
  return Number(latest?.calculatedLimit || 0);
}

async function resolveApprovedLimitPortion(rec) {
  const stored = Number(rec.calculatedLimit || 0);
  if (stored > 0) return stored;
  const inr = Number(rec.currencyInr || 0);
  if (inr <= 0) return 0;
  const sr = Number(rec.shareRatio || 30);
  return Number((inr * sr / 100).toFixed(2));
}

/** Spendable cap for this approval = admin Limit (calculatedLimit), not cumulative with prior pay-ins. */
function resolveAvailableBalance(rec, limitPortion) {
  const stored = Number(rec.calculatedLimit || 0);
  if (stored > 0) return stored;
  return Math.max(0, limitPortion);
}

async function updatePayoutStatusById(id, statusInput, note, actedBy) {
  const status = normalizePayoutStatus(statusInput);
  if (!status) throw new Error('status is invalid');
  if (![STATUS.PENDING, STATUS.APPROVED, STATUS.REJECTED].includes(status)) {
    throw new Error('Only Pending, Approved, or Rejected status is allowed.');
  }

  const rec = await DsaPayout.findById(id).lean();
  if (!rec) return null;

  const actor = cleanString(actedBy);
  const noteText = cleanString(note);
  if (status === STATUS.REJECTED && !isValidPayoutRemark(noteText)) {
    throw new Error('A valid remark is required when rejecting.');
  }
  const patch = {
    status,
    lastActedBy: actor,
    lastActedAt: new Date(),
  };

  if (status === STATUS.APPROVED) {
    const limitPortion = await resolveApprovedLimitPortion(rec);
    const availableBalance = resolveAvailableBalance(rec, limitPortion);
    if (Number(rec.calculatedLimit || 0) <= 0 && limitPortion > 0) {
      patch.calculatedLimit = limitPortion;
    }
    Object.assign(patch, {
      approvalNote: noteText,
      rejectionReason: '',
      approvedBy: actor,
      approvedAt: new Date(),
      rejectedBy: '',
      rejectedAt: null,
      availableBalance,
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

async function updatePayoutFieldsById(id, fields = {}) {
  const rec = await DsaPayout.findById(id).lean();
  if (!rec) return null;
  const patch = {};
  if (fields.currencyInr != null) {
    patch.currencyInr = asNonNegativeNumber(fields.currencyInr, 'currencyInr');
  }
  if (fields.calculatedLimit != null) {
    patch.calculatedLimit = asNonNegativeNumber(fields.calculatedLimit, 'calculatedLimit');
  }
  if (!Object.keys(patch).length) return rec;
  return DsaPayout.findOneAndUpdate({ _id: id }, { $set: patch }, { returnDocument: 'after' }).lean();
}

async function getApprovedAvailableBalanceForDsa(dsaCode) {
  const code = cleanString(dsaCode).toUpperCase();
  if (!code) return 0;
  const latest = await DsaPayout.findOne({ dsaCode: code, status: STATUS.APPROVED })
    .sort({ approvedAt: -1, updatedAt: -1 })
    .select('calculatedLimit currencyInr shareRatio availableBalance')
    .lean();
  if (!latest) return 0;
  const limit = Number(latest.calculatedLimit || 0);
  if (limit > 0) return limit;
  const portion = await resolveApprovedLimitPortion(latest);
  if (portion > 0) return portion;
  return Math.max(0, Number(latest.availableBalance || 0));
}

module.exports = {
  STATUS,
  listPayouts,
  createPayout,
  updatePayoutFieldsById,
  updatePayoutStatusById,
  approvePayoutById,
  rejectPayoutById,
  getApprovedAvailableBalanceForDsa,
};
