const DsaLimit = require('../models/DsaLimit');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
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

module.exports = {
  syncFromApprovedPayout,
};
