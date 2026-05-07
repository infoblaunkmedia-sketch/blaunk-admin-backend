const Shareholding = require('../models/Shareholding');
const EmployeeCredentials = require('../models/EmployeeCredentials');

const FY_MONTHS = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
  'January',
  'February',
  'March',
];

/**
 * India FY: April `financialYear` → March `financialYear + 1`.
 * @param {string} financialYear e.g. "2024"
 * @param {string} monthName e.g. "April"
 * @returns {{ from: Date, to: Date } | null}
 */
function fyMonthToUtcRange(financialYear, monthName) {
  const y = parseInt(financialYear, 10);
  const idx = FY_MONTHS.indexOf(monthName);
  if (!financialYear || Number.isNaN(y) || idx < 0) return null;
  let calYear = y;
  let calMonthIndex;
  if (idx <= 8) {
    calYear = y;
    calMonthIndex = idx + 3;
  } else {
    calYear = y + 1;
    calMonthIndex = idx - 9;
  }
  const from = new Date(Date.UTC(calYear, calMonthIndex, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(calYear, calMonthIndex + 1, 0, 23, 59, 59, 999));
  return { from, to };
}

async function upsertShareholdingMongo(payload) {
  const pan = String(payload.pan || '')
    .trim()
    .toUpperCase();
  const normalized = { ...payload, pan };
  const record = await Shareholding.findOneAndUpdate(
    { pan },
    { $set: normalized },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return record;
}

async function getShareholdingByPanMongo(pan) {
  const record = await Shareholding.findOne({ pan }).lean();
  return record;
}

async function listShareholdings({ q, limit = 200 } = {}) {
  const query = {};
  if (q && String(q).trim()) {
    const needle = String(q).trim();
    query.$or = [
      { pan: { $regex: needle, $options: 'i' } },
      { name: { $regex: needle, $options: 'i' } },
      { folioNumber: { $regex: needle, $options: 'i' } },
      { mobile: { $regex: needle, $options: 'i' } },
      { email: { $regex: needle, $options: 'i' } },
    ];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);
  const list = await Shareholding.find(query)
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .lean();
  return list || [];
}

async function deleteByPan(pan) {
  const normalizedPan = String(pan || '').trim().toUpperCase();
  if (!normalizedPan) throw new Error('PAN is required');
  const res = await Shareholding.deleteOne({ pan: normalizedPan });
  return res.deletedCount || 0;
}

async function upsertShareholding(payload) {
  return upsertShareholdingMongo(payload);
}

async function getShareholdingByPan(pan) {
  return getShareholdingByPanMongo(pan);
}

function panRegexCaseInsensitive(panUpper) {
  const escaped = String(panUpper).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function getCombinedByPan(pan) {
  const p = String(pan || '')
    .trim()
    .toUpperCase();
  if (!p) return null;
  const [record, credential] = await Promise.all([
    Shareholding.findOne({ pan: p }).lean(),
    EmployeeCredentials.findOne({ pan: panRegexCaseInsensitive(p) }).lean(),
  ]);
  if (!record && !credential) return null;
  return { record, credential };
}

/**
 * MIS rows: Shareholding records, optionally filtered by updatedAt range and
 * EmployeeCredentials department/status (same PAN).
 * @param {{ financialYear?: string, month?: string, department?: string, status?: string }} filters
 */
async function listShareholdingMISRows(filters) {
  const { financialYear, month, department, status } = filters || {};
  let range = null;
  if (financialYear && month) {
    range = fyMonthToUtcRange(financialYear, month);
  }

  const credQuery = {};
  if (department) credQuery.department = department;
  if (status) credQuery.status = status;

  let panSet = null;
  if (Object.keys(credQuery).length > 0) {
    const pans = await EmployeeCredentials.find(credQuery).distinct('pan');
    panSet = new Set((pans || []).map((x) => String(x).trim().toUpperCase()).filter(Boolean));
    if (panSet.size === 0) return [];
  }

  const shQuery = {};
  if (range) {
    shQuery.updatedAt = { $gte: range.from, $lte: range.to };
  }

  let rows = await Shareholding.find(shQuery).sort({ updatedAt: -1 }).lean();
  if (panSet) {
    rows = rows.filter((r) => panSet.has(String(r.pan).trim().toUpperCase()));
  }

  const pans = rows.map((r) => String(r.pan).trim().toUpperCase()).filter(Boolean);
  const credMap = {};
  if (pans.length > 0) {
    const creds = await EmployeeCredentials.find({
      $expr: { $in: [{ $toUpper: '$pan' }, pans] },
    }).lean();
    creds.forEach((c) => {
      credMap[String(c.pan).trim().toUpperCase()] = c;
    });
  }

  return rows.map((sh) => {
    const p = String(sh.pan).trim().toUpperCase();
    const c = credMap[p];
    return { shareholding: sh, credential: c || null };
  });
}

module.exports = {
  upsertShareholding,
  getShareholdingByPan,
  getCombinedByPan,
  listShareholdings,
  deleteByPan,
  listShareholdingMISRows,
  fyMonthToUtcRange,
};

