const MatchCode = require('../models/MatchCode');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function toEntry(doc) {
  if (!doc) return null;
  return {
    _id: String(doc._id),
    code: cleanString(doc.code),
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

async function generateNew(generatedBy) {
  const code = String(Math.floor(10000 + Math.random() * 90000));
  await MatchCode.updateMany({ isActive: true }, { $set: { isActive: false } });
  const created = await MatchCode.create({
    code,
    generatedBy: cleanString(generatedBy) || 'system',
    isActive: true,
  });
  return toEntry(created.toObject());
}

async function validateCode(code) {
  const normalized = cleanString(code);
  if (!normalized) return false;
  const active = await getActive();
  return !!active && active.code === normalized;
}

module.exports = {
  listHistory,
  getActive,
  generateNew,
  validateCode,
};
