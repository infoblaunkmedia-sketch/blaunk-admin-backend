const EmployeeCredentials = require('../models/EmployeeCredentials');
const ThirdPartyCredential = require('../models/ThirdPartyCredential');

/**
 * List employee codes from database (EmployeeCredentials).
 * Returns distinct empCode + employeeName; one entry per empCode.
 */
async function listEmployeeCodesFromDb() {
  const docs = await EmployeeCredentials.find(
    { empCode: { $exists: true, $ne: null, $ne: '' } },
    { empCode: 1, employeeName: 1 },
  )
    .sort({ updatedAt: -1 })
    .lean();

  const byCode = new Map();
  for (const d of docs) {
    const code = (d.empCode && String(d.empCode).trim()) || '';
    if (!code || byCode.has(code)) continue;
    byCode.set(code, {
      id: code,
      code,
      name: (d.employeeName && String(d.employeeName).trim()) || code,
    });
  }
  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
}

/**
 * List 3PC codes from database (ThirdPartyCredential).
 * Returns distinct threePEmplCode + name; one entry per code.
 */
async function listThreePcCodesFromDb() {
  const docs = await ThirdPartyCredential.find(
    { threePEmplCode: { $exists: true, $ne: null, $ne: '' } },
    { threePEmplCode: 1, name: 1 },
  )
    .sort({ updatedAt: -1 })
    .lean();

  const byCode = new Map();
  for (const d of docs) {
    const code = (d.threePEmplCode && String(d.threePEmplCode).trim().toUpperCase()) || '';
    if (!code || byCode.has(code)) continue;
    byCode.set(code, {
      id: code,
      code,
      name: (d.name && String(d.name).trim()) || code,
    });
  }
  return Array.from(byCode.values()).sort((a, b) => a.code.localeCompare(b.code));
}

async function listEmployeeCodes(type) {
  if (type === '3pc') {
    return listThreePcCodesFromDb();
  }
  return listEmployeeCodesFromDb();
}

function nextCodeFromList(codes, prefix, pad = 4) {
  const max = (codes || []).reduce((acc, item) => {
    const raw = String(item?.code || '').trim().toUpperCase();
    const re = new RegExp(`^${prefix}(\\d+)$`);
    const m = raw.match(re);
    if (!m) return acc;
    const n = parseInt(m[1], 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

async function getNextEmployeeCode(type) {
  if (type === '3pc') {
    const list = await listThreePcCodesFromDb();
    return nextCodeFromList(list, '3PC', 4);
  }
  const list = await listEmployeeCodesFromDb();
  return nextCodeFromList(list, 'E', 4);
}

module.exports = {
  listEmployeeCodes,
  getNextEmployeeCode,
};

