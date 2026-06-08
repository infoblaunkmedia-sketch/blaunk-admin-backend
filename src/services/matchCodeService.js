const MatchCode = require('../models/MatchCode');
const ThirdPartyCredential = require('../models/ThirdPartyCredential');

const VALIDITY_MS = 45 * 60 * 1000;

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
    generatorFor: cleanString(doc.generatorFor).toUpperCase(),
    generatedAt: doc.createdAt,
    validUntil: doc.validUntil || null,
    isActive: !!doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function isEntryValid(entry) {
  if (!entry?.isActive) return false;
  if (entry.validUntil && new Date(entry.validUntil).getTime() < Date.now()) return false;
  return true;
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

async function getActiveForEmployee(threePEmplCode) {
  const code = cleanString(threePEmplCode).toUpperCase();
  if (!code) return null;
  const rec = await MatchCode.findOne({ generatorFor: code, isActive: true })
    .sort({ createdAt: -1 })
    .lean();
  const entry = toEntry(rec);
  return isEntryValid(entry) ? entry : null;
}

async function syncCredentialMatchCode(threePEmplCode, activeCode) {
  const emp = cleanString(threePEmplCode).toUpperCase();
  if (!emp) return { modifiedCount: 0 };
  const updated = await ThirdPartyCredential.updateOne(
    { threePEmplCode: emp },
    { $set: { matchCode: cleanString(activeCode) || null } },
  );
  return { modifiedCount: updated.modifiedCount || 0 };
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

async function resolveActiveMatchCodeFor3p(empCode) {
  const code = cleanString(empCode).toUpperCase();
  const active = code ? await getActiveForEmployee(code) : await getActive();
  if (!active?.code) {
    throw new Error('No active Match Code. Generate one in Management → Match Code first.');
  }
  return active.code;
}

async function generateNew(generatedBy, threePEmplCode) {
  const emp = cleanString(threePEmplCode).toUpperCase();
  if (!emp) throw new Error('3P employee code is required.');

  const credential = await ThirdPartyCredential.findOne({ threePEmplCode: emp })
    .select('threePEmplCode')
    .lean();
  if (!credential) throw new Error('3P employee not found.');

  const matchCode = String(Math.floor(10000 + Math.random() * 90000));
  const validUntil = new Date(Date.now() + VALIDITY_MS);

  await MatchCode.updateMany({ generatorFor: emp, isActive: true }, { $set: { isActive: false } });

  const created = await MatchCode.create({
    code: matchCode,
    generatedBy: cleanString(generatedBy) || 'system',
    generatorFor: emp,
    validUntil,
    isActive: true,
  });

  await syncCredentialMatchCode(emp, matchCode);

  return { entry: toEntry(created.toObject()), synced3pCount: 1 };
}

async function validateCode(code, empCode) {
  const normalized = normalizeMatchCode(code);
  if (!normalized) return false;

  const emp = cleanString(empCode).toUpperCase();
  if (emp) {
    const cred = await ThirdPartyCredential.findOne({ threePEmplCode: emp })
      .select('matchCode')
      .lean();
    if (normalizeMatchCode(cred?.matchCode) !== normalized) return false;
    const rec = await MatchCode.findOne({ code: normalized, generatorFor: emp })
      .sort({ createdAt: -1 })
      .lean();
    return isEntryValid(toEntry(rec));
  }

  const active = await getActive();
  if (!active?.code) return false;
  return normalizeMatchCode(active.code) === normalized && isEntryValid(active);
}

async function updateStatusById(id, isActive) {
  const rec = await MatchCode.findById(id).lean();
  if (!rec) return null;
  const patch = { isActive: !!isActive };
  const updated = await MatchCode.findOneAndUpdate(
    { _id: id },
    { $set: patch },
    { returnDocument: 'after' },
  ).lean();

  if (updated && updated.generatorFor) {
    if (updated.isActive && isEntryValid(toEntry(updated))) {
      await syncCredentialMatchCode(updated.generatorFor, updated.code);
    } else {
      const stillActive = await getActiveForEmployee(updated.generatorFor);
      if (!stillActive) {
        await syncCredentialMatchCode(updated.generatorFor, '');
      }
    }
  }

  return toEntry(updated);
}

module.exports = {
  listHistory,
  getActive,
  getActiveForEmployee,
  generateNew,
  validateCode,
  syncAllThirdPartyCredentials,
  syncCredentialMatchCode,
  resolveActiveMatchCodeFor3p,
  updateStatusById,
  VALIDITY_MS,
};
