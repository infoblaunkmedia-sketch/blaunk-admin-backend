const Dsa = require('../models/Dsa');
const ThirdPartyCredential = require('../models/ThirdPartyCredential');

function cleanCode(v) {
  return String(v == null ? '' : v).trim().toUpperCase();
}

async function getWebsiteDsaCodes() {
  const rows = await Dsa.find({ dsaType: 'website' }).select('dsaCode').lean();
  return (rows || []).map((r) => cleanCode(r.dsaCode)).filter(Boolean);
}

async function getDsaByCode(dsaCode) {
  const code = cleanCode(dsaCode);
  if (!code) return null;
  return Dsa.findOne({ dsaCode: code }).lean();
}

async function isAdminPanelDsa(dsaCode) {
  const code = cleanCode(dsaCode);
  if (!code) return false;
  const row = await getDsaByCode(code);
  if (row) return row.dsaType === 'admin';
  const cred = await ThirdPartyCredential.findOne({ threePEmplCode: code })
    .select('threePEmplCode')
    .lean();
  return !!cred;
}

/**
 * Register or update an admin-panel DSA (3P employee / admin-assigned code).
 */
async function ensureAdminDsa({ dsaCode, name, companyName, mobile, email, country, status } = {}) {
  const code = cleanCode(dsaCode);
  if (!code) return null;

  const set = {
    dsaType: 'admin',
    name: String(name || '').trim(),
    companyName: String(companyName || '').trim(),
    mobile: String(mobile || '').trim(),
    email: String(email || '').trim(),
    country: String(country || '').trim(),
    status: String(status || 'Active').trim() || 'Active',
  };

  return Dsa.findOneAndUpdate(
    { dsaCode: code },
    { $set: set, $setOnInsert: { dsaCode: code } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
}

async function ensureWebsiteDsa({ dsaCode, name, companyName, mobile, email, country } = {}) {
  const code = cleanCode(dsaCode);
  if (!code) return null;

  const existing = await getDsaByCode(code);
  if (existing?.dsaType === 'admin') {
    throw new Error('DSA code is reserved for admin panel use.');
  }

  const set = {
    dsaType: 'website',
    name: String(name || '').trim(),
    companyName: String(companyName || '').trim(),
    mobile: String(mobile || '').trim(),
    email: String(email || '').trim(),
    country: String(country || '').trim(),
    status: String(existing?.status || 'Active').trim() || 'Active',
  };

  return Dsa.findOneAndUpdate(
    { dsaCode: code },
    { $set: set, $setOnInsert: { dsaCode: code } },
    { upsert: true, returnDocument: 'after' },
  ).lean();
}

/** Backfill admin DSAs from existing 3P credentials. */
async function getDsaProfileByCode(dsaCode) {
  const code = cleanCode(dsaCode);
  if (!code) {
    return { companyName: '', country: '', shareRatio: 30, ownerName: '' };
  }
  const cred = await ThirdPartyCredential.findOne({ threePEmplCode: code })
    .select('threePCompanyName country sharingThreeP name')
    .lean();
  if (cred) {
    const shareRaw = Number(cred.sharingThreeP);
    return {
      companyName: String(cred.threePCompanyName || '').trim(),
      country: String(cred.country || '').trim() || 'India',
      shareRatio: Number.isFinite(shareRaw) && shareRaw > 0 ? shareRaw : 30,
      ownerName: String(cred.name || '').trim(),
    };
  }
  const dsa = await getDsaByCode(code);
  if (dsa) {
    return {
      companyName: String(dsa.companyName || '').trim(),
      country: String(dsa.country || '').trim() || 'India',
      shareRatio: 30,
      ownerName: String(dsa.name || '').trim(),
    };
  }
  return { companyName: '', country: 'India', shareRatio: 30, ownerName: '' };
}

async function syncAdminDsasFromCredentials() {
  const creds = await ThirdPartyCredential.find({ threePEmplCode: { $ne: '' } })
    .select('threePEmplCode name threePCompanyName mobileNo email country status')
    .lean();
  await Promise.all(
    (creds || []).map((c) =>
      ensureAdminDsa({
        dsaCode: c.threePEmplCode,
        name: c.name,
        companyName: c.threePCompanyName,
        mobile: c.mobileNo,
        email: c.email,
        country: c.country,
        status: c.status,
      }),
    ),
  );
}

module.exports = {
  getWebsiteDsaCodes,
  getDsaByCode,
  getDsaProfileByCode,
  isAdminPanelDsa,
  ensureAdminDsa,
  ensureWebsiteDsa,
  syncAdminDsasFromCredentials,
};
