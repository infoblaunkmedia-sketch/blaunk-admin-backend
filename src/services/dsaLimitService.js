const DsaLimit = require('../models/DsaLimit');
const DsaSlider = require('../models/DsaSlider');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

async function getLimitRecord(dsaCode) {
  const code = cleanString(dsaCode).toUpperCase();
  if (!code) return null;
  return DsaLimit.findOne({ dsaCode: code }).lean();
}

async function assertUploadAllowed(dsaCode) {
  const code = cleanString(dsaCode).toUpperCase();
  if (!code) return;
  const limitRecord = await getLimitRecord(code);
  if (!limitRecord || !Number(limitRecord.maxSlots)) return;
  const activeCount = await DsaSlider.countDocuments({ dsaCode: code, status: 'Active' });
  if (activeCount >= Number(limitRecord.maxSlots)) {
    const err = new Error('Upload limit reached for this DSA');
    err.statusCode = 403;
    throw err;
  }
}

async function syncFromApprovedPayout(payout) {
  const code = cleanString(payout?.dsaCode).toUpperCase();
  if (!code) return null;
  const patch = {
    dsaName: cleanString(payout.dsaName),
    newAmount: Number(payout.newAmount || 0),
    bodBalance: Number(payout.bodBalance || 0),
    usedValue: Number(payout.usedValue || 0),
    availableBalance: Number(payout.availableBalance || 0),
  };
  return DsaLimit.findOneAndUpdate(
    { dsaCode: code },
    { $set: patch, $setOnInsert: { dsaCode: code, maxSlots: 0 } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
}

async function getUploadStatus(dsaCode) {
  const code = cleanString(dsaCode).toUpperCase();
  const limitRecord = code ? await getLimitRecord(code) : null;
  const activeUploads = code ? await DsaSlider.countDocuments({ dsaCode: code, status: 'Active' }) : 0;
  const expiredUploads = code ? await DsaSlider.countDocuments({ dsaCode: code, status: 'Expired' }) : 0;
  const totalUploads = code ? await DsaSlider.countDocuments({ dsaCode: code }) : 0;
  const maxSlots = limitRecord ? Number(limitRecord.maxSlots || 0) : 0;
  const remainingSlots = maxSlots > 0 ? Math.max(0, maxSlots - activeUploads) : null;
  return {
    dsaCode: code,
    dsaName: limitRecord?.dsaName || '',
    maxSlots,
    activeUploads,
    remainingSlots,
    expiredUploads,
    totalUploads,
  };
}

async function getUsageSummary({ dsaCode } = {}) {
  const filter = cleanString(dsaCode).toUpperCase();
  const limitQuery = filter ? { dsaCode: filter } : {};
  const limits = await DsaLimit.find(limitQuery).lean();

  const sliderCodes = await DsaSlider.distinct('dsaCode');
  const codes = new Set([
    ...limits.map((l) => cleanString(l.dsaCode).toUpperCase()),
    ...sliderCodes.map((c) => cleanString(c).toUpperCase()).filter(Boolean),
  ]);
  if (filter) {
    for (const c of [...codes]) {
      if (c !== filter) codes.delete(c);
    }
    if (!codes.size && filter) codes.add(filter);
  }

  const rows = [];
  for (const code of [...codes].sort()) {
    if (!code) continue;
    const limitRecord = limits.find((l) => cleanString(l.dsaCode).toUpperCase() === code) || null;
    const activeUploads = await DsaSlider.countDocuments({ dsaCode: code, status: 'Active' });
    const expiredUploads = await DsaSlider.countDocuments({ dsaCode: code, status: 'Expired' });
    const totalUploads = await DsaSlider.countDocuments({ dsaCode: code });
    const maxSlots = limitRecord ? Number(limitRecord.maxSlots || 0) : 0;
    rows.push({
      dsaCode: code,
      dsaName: limitRecord?.dsaName || '',
      maxSlots,
      activeUploads,
      remainingSlots: maxSlots > 0 ? Math.max(0, maxSlots - activeUploads) : null,
      expiredUploads,
      totalUploads,
    });
  }
  return rows;
}

module.exports = {
  getLimitRecord,
  assertUploadAllowed,
  syncFromApprovedPayout,
  getUploadStatus,
  getUsageSummary,
};
