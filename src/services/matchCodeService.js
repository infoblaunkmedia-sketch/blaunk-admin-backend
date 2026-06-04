const MatchCode = require('../models/MatchCode');
const ThirdPartyCredential = require('../models/ThirdPartyCredential');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

/** Digits-only match code (5-digit codes from generateNew). */
function normalizeMatchCode(v) {
  return cleanString(v).replace(/\D/g, '');
}

function toEntry(doc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    code: normalizeMatchCode(doc.code) || cleanString(doc.code),
    generatedBy: cleanString(doc.generatedBy),
    generatedAt: doc.createdAt,
    isActive: !!doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function listHistory(limit = 200) {
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);
  const rows = await MatchCode.find({}).sort({ createdAt: -1 }).limit(safeLimit).lean();
  return (rows || []).map(toEntry);
}

async function getActive() {
  const rec = await MatchCode.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
  return toEntry(rec);
}

async function syncAllThirdPartyCredentials(activeCode) {
  const code = cleanString(activeCode);
  if (!code) {
    const cleared = await ThirdPartyCredential.updateMany({}, { $set: { matchCode: null } });
    return { modifiedCount: cleared.modifiedCount || 0 };
  }
  const updated = await ThirdPartyCredential.updateMany({}, { $set: { matchCode: code } });
  return { modifiedCount: updated.modifiedCount || 0 };
}

async function resolveActiveMatchCodeFor3p() {
  const active = await getActive();
  if (!active?.code) {
    throw new Error('No active Match Code. Generate one in Settings → Match Code first.');
  }
  return active.code;
}

async function generateNew(generatedBy) {
  const code = String(Math.floor(10000 + Math.random() * 90000));
  await MatchCode.updateMany({ isActive: true }, { $set: { isActive: false } });
  const created = await MatchCode.create({
    code,
    generatedBy: cleanString(generatedBy) || 'system',
    isActive: true,
  });
  const sync = await syncAllThirdPartyCredentials(code);
  return { entry: toEntry(created.toObject()), synced3pCount: sync.modifiedCount };
}

async function validateCode(code) {
  const normalized = normalizeMatchCode(code);
  if (!normalized) return false;
  const active = await getActive();
  if (!active?.code) return false;
  return normalizeMatchCode(active.code) === normalized;
}

module.exports = {
  listHistory,
  getActive,
  generateNew,
  validateCode,
  syncAllThirdPartyCredentials,
  resolveActiveMatchCodeFor3p,
};
