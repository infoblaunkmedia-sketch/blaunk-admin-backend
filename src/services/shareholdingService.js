const mongoose = require('mongoose');
const Shareholder = require('../models/Shareholder');
const ShareholdingHistory = require('../models/ShareholdingHistory');
const ShareholdingLegacy = require('../models/ShareholdingLegacy');
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

function normalizePan(p) {
  return String(p || '')
    .trim()
    .toUpperCase();
}

function normalizeYear(y) {
  const s = String(y || '').trim();
  return s || '_';
}

function normalizeProjectKey(k) {
  const s = String(k || '').trim();
  return s || '_';
}

function isValidObjectId(id) {
  if (id == null) return false;
  const s = String(id).trim();
  if (!s) return false;
  if (!mongoose.Types.ObjectId.isValid(s)) return false;
  return String(new mongoose.Types.ObjectId(s)) === s;
}

function identityFieldsFromPayload(payload) {
  return {
    name: payload.name,
    mobile: payload.mobile,
    email: payload.email,
    aadhaar: payload.aadhaar,
    address: payload.address,
    city: payload.city,
    landmark: payload.landmark,
    country: payload.country,
    gender: payload.gender,
  };
}

function historyFieldsFromPayload(payload) {
  return {
    holdingPercent: payload.holdingPercent,
    shareType: payload.shareType,
    faceValue: payload.faceValue,
    numberOfShares: payload.numberOfShares,
    mode: payload.mode,
    isinCode: payload.isinCode,
    dpNumber: payload.dpNumber,
    dp: payload.dp,
    beneficiaryDpId: payload.beneficiaryDpId,
    folioNumber: payload.folioNumber,
    certificateNumber: payload.certificateNumber,
    distinctiveFrom: payload.distinctiveFrom,
    distinctiveTo: payload.distinctiveTo,
    yearOfIssuance: payload.yearOfIssuance,
    stakeholder: payload.stakeholder,
    dateOfAllotment: payload.dateOfAllotment,
    remarks: payload.remarks,
    exitDate: payload.exitDate,
    bankName: payload.bankName,
    ifscCode: payload.ifscCode,
    bankAccountNumber: payload.bankAccountNumber,
    bankCity: payload.bankCity,
    bankCountry: payload.bankCountry,
    pledge: payload.pledge,
    shareStatus: payload.shareStatus,
    nominees: Array.isArray(payload.nominees) ? payload.nominees : [],
  };
}

function mergeShareholderAndHistory(sh, hist) {
  const h = hist || {};
  const s = sh || {};
  if (!s.pan && !h.pan) return null;
  return {
    _id: s._id || h.shareholder,
    pan: s.pan || h.pan,
    name: s.name,
    mobile: s.mobile,
    email: s.email,
    aadhaar: s.aadhaar,
    address: s.address,
    city: s.city,
    landmark: s.landmark,
    country: s.country,
    gender: s.gender,
    holdingPercent: h.holdingPercent,
    shareType: h.shareType,
    faceValue: h.faceValue,
    numberOfShares: h.numberOfShares,
    mode: h.mode,
    isinCode: h.isinCode,
    dpNumber: h.dpNumber,
    dp: h.dp,
    beneficiaryDpId: h.beneficiaryDpId,
    folioNumber: h.folioNumber,
    certificateNumber: h.certificateNumber,
    distinctiveFrom: h.distinctiveFrom,
    distinctiveTo: h.distinctiveTo,
    yearOfIssuance: h.yearOfIssuance,
    stakeholder: h.stakeholder,
    dateOfAllotment: h.dateOfAllotment,
    remarks: h.remarks,
    exitDate: h.exitDate,
    year: h.year,
    projectKey: h.projectKey === '_' ? '' : h.projectKey,
    bankName: h.bankName,
    ifscCode: h.ifscCode,
    bankAccountNumber: h.bankAccountNumber,
    bankCity: h.bankCity,
    bankCountry: h.bankCountry,
    pledge: h.pledge,
    shareStatus: h.shareStatus,
    nominees: h.nominees,
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
    historyId: h._id,
  };
}

/**
 * India FY: April `financialYear` → March `financialYear + 1`.
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

async function migrateLegacyShareholdingsIfNeeded() {
  const legacyCount = await ShareholdingLegacy.countDocuments();
  if (legacyCount === 0) return { migrated: 0 };

  const legacies = await ShareholdingLegacy.find().lean();
  let migrated = 0;
  for (const doc of legacies) {
    const pan = normalizePan(doc.pan);
    if (!pan) continue;

    const identity = {
      pan,
      name: doc.name,
      mobile: doc.mobile,
      email: doc.email,
      aadhaar: doc.aadhaar,
      address: doc.address,
      city: doc.city,
      landmark: doc.landmark,
      country: doc.country,
      gender: doc.gender,
    };

    let sh = await Shareholder.findOne({ pan }).exec();
    if (!sh) {
      sh = await Shareholder.create(identity);
    } else {
      await Shareholder.updateOne({ _id: sh._id }, { $set: identity }).exec();
      sh = await Shareholder.findById(sh._id).exec();
    }

    const year = normalizeYear(doc.year);
    const projectKey = '_';
    const histPayload = {
      shareholder: sh._id,
      pan,
      year,
      projectKey,
      holdingPercent: doc.holdingPercent,
      shareType: doc.shareType,
      faceValue: doc.faceValue,
      numberOfShares: doc.numberOfShares,
      mode: doc.mode,
      isinCode: doc.isinCode,
      dpNumber: doc.dpNumber,
      beneficiaryDpId: doc.beneficiaryDpId,
      folioNumber: doc.folioNumber,
      distinctiveFrom: doc.distinctiveFrom,
      distinctiveTo: doc.distinctiveTo,
      yearOfIssuance: doc.yearOfIssuance,
      stakeholder: doc.stakeholder,
      dateOfAllotment: doc.dateOfAllotment,
      remarks: doc.remarks,
      exitDate: doc.exitDate,
      bankName: doc.bankName,
      ifscCode: doc.ifscCode,
      bankAccountNumber: doc.bankAccountNumber,
      bankCity: doc.bankCity,
      bankCountry: doc.bankCountry,
      pledge: doc.pledge,
      shareStatus: doc.shareStatus,
      nominees: doc.nominees || [],
    };

    await ShareholdingHistory.findOneAndUpdate(
      { pan, year, projectKey },
      { $set: histPayload },
      { upsert: true, setDefaultsOnInsert: true },
    ).exec();

    await ShareholdingLegacy.deleteOne({ _id: doc._id }).exec();
    migrated += 1;
  }

  return { migrated };
}

/**
 * Upsert shareholder identity + one history slice (by historyId or pan+year+projectKey).
 */
async function upsertShareholding(payload) {
  const pan = normalizePan(payload.pan);
  if (!pan) throw new Error('PAN is required');

  const rawHistoryId = payload.historyId ? String(payload.historyId).trim() : '';
  const historyId = isValidObjectId(rawHistoryId) ? rawHistoryId : '';
  const year = normalizeYear(payload.year);
  const projectKey = normalizeProjectKey(payload.projectKey);

  const identity = identityFieldsFromPayload({ ...payload, pan });
  const historyData = historyFieldsFromPayload(payload);

  let shareholder = await Shareholder.findOneAndUpdate(
    { pan },
    { $set: { pan, ...identity } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  let historyDoc;

  if (historyId) {
    const existing = await ShareholdingHistory.findById(historyId).lean();
    if (!existing || normalizePan(existing.pan) !== pan) {
      throw new Error('Invalid history record for this PAN.');
    }
    const nextYear = year;
    const nextProject = projectKey;
    if (
      (existing.year !== nextYear || existing.projectKey !== nextProject) &&
      (await ShareholdingHistory.findOne({
        pan,
        year: nextYear,
        projectKey: nextProject,
        _id: { $ne: existing._id },
      }).lean())
    ) {
      throw new Error('Another history entry already exists for this year and project reference.');
    }
    historyDoc = await ShareholdingHistory.findOneAndUpdate(
      { _id: existing._id },
      {
        $set: {
          year: nextYear,
          projectKey: nextProject,
          pan,
          shareholder: shareholder._id,
          ...historyData,
        },
      },
      { new: true },
    ).lean();
  } else {
    historyDoc = await ShareholdingHistory.findOneAndUpdate(
      { pan, year, projectKey },
      {
        $set: {
          pan,
          year,
          projectKey,
          shareholder: shareholder._id,
          ...historyData,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
  }

  const allHistory = await ShareholdingHistory.find({ pan })
    .sort({ updatedAt: -1 })
    .lean();

  return {
    shareholder,
    historyRecord: historyDoc,
    history: allHistory,
    record: mergeShareholderAndHistory(shareholder, historyDoc),
  };
}

async function getShareholdingByPan(pan) {
  const p = normalizePan(pan);
  if (!p) return null;
  const shareholder = await Shareholder.findOne({ pan: p }).lean();
  if (!shareholder) return null;
  const history = await ShareholdingHistory.find({ pan: p })
    .sort({ updatedAt: -1 })
    .lean();
  return { shareholder, history };
}

function panRegexCaseInsensitive(panUpper) {
  const escaped = String(panUpper).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped}$`, 'i');
}

async function getCombinedByPan(pan) {
  const p = normalizePan(pan);
  if (!p) return null;
  const [bundle, credential] = await Promise.all([
    getShareholdingByPan(p),
    EmployeeCredentials.findOne({ pan: panRegexCaseInsensitive(p) }).lean(),
  ]);
  if (!bundle?.shareholder && !credential) return null;
  const shareholder = bundle?.shareholder || null;
  const history = bundle?.history || [];
  return {
    shareholder,
    history,
    credential,
    record: shareholder ? mergeShareholderAndHistory(shareholder, history[0]) : null,
  };
}

async function listShareholdings({ q, limit = 200 } = {}) {
  const needle = q && String(q).trim() ? String(q).trim() : '';
  let shareholderQuery = {};
  if (needle) {
    shareholderQuery.$or = [
      { pan: { $regex: needle, $options: 'i' } },
      { name: { $regex: needle, $options: 'i' } },
      { mobile: { $regex: needle, $options: 'i' } },
      { email: { $regex: needle, $options: 'i' } },
    ];
  }

  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);
  let shareholders = await Shareholder.find(shareholderQuery)
    .sort({ updatedAt: -1 })
    .limit(safeLimit)
    .lean();

  if (needle && shareholders.length === 0) {
    const histMatch = {
      $or: [
        { folioNumber: { $regex: needle, $options: 'i' } },
        { isinCode: { $regex: needle, $options: 'i' } },
      ],
    };
    const pansFromHist = await ShareholdingHistory.distinct('pan', histMatch);
    if (pansFromHist.length) {
      shareholders = await Shareholder.find({ pan: { $in: pansFromHist.map(normalizePan) } })
        .sort({ updatedAt: -1 })
        .limit(safeLimit)
        .lean();
    }
  }

  const pans = shareholders.map((s) => s.pan);
  const histories = await ShareholdingHistory.find({ pan: { $in: pans } })
    .sort({ updatedAt: -1 })
    .lean();

  const latestByPan = {};
  const countByPan = {};
  for (const h of histories) {
    const key = normalizePan(h.pan);
    if (!countByPan[key]) countByPan[key] = 0;
    countByPan[key] += 1;
    if (!latestByPan[key]) latestByPan[key] = h;
  }

  return shareholders.map((sh) => {
    const latest = latestByPan[sh.pan];
    const merged = mergeShareholderAndHistory(sh, latest);
    return {
      ...merged,
      historyCount: countByPan[sh.pan] || 0,
    };
  });
}

async function deleteByPan(pan) {
  const normalizedPan = normalizePan(pan);
  if (!normalizedPan) throw new Error('PAN is required');
  await ShareholdingHistory.deleteMany({ pan: normalizedPan }).exec();
  const res = await Shareholder.deleteOne({ pan: normalizedPan }).exec();
  return res.deletedCount || 0;
}

async function deleteHistoryById(pan, historyId) {
  const p = normalizePan(pan);
  if (!p || !historyId) throw new Error('PAN and history id are required');
  const res = await ShareholdingHistory.deleteOne({ _id: historyId, pan: p }).exec();
  return res.deletedCount || 0;
}

function parseDateRange(fromDate, toDate) {
  const from = String(fromDate || '').trim();
  const to = String(toDate || '').trim();
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { from: start, to: end };
}

async function listShareholdingMISRows(filters) {
  const { financialYear, month, fromDate, toDate, department, status } = filters || {};
  let range = parseDateRange(fromDate, toDate);
  if (!range && financialYear && month) {
    range = fyMonthToUtcRange(financialYear, month);
  }

  const credQuery = {};
  if (department) credQuery.department = department;
  if (status) credQuery.status = status;

  let panSet = null;
  if (Object.keys(credQuery).length > 0) {
    const pans = await EmployeeCredentials.find(credQuery).distinct('pan');
    panSet = new Set((pans || []).map((x) => normalizePan(x)).filter(Boolean));
    if (panSet.size === 0) return [];
  }

  const shQuery = {};
  if (range) {
    shQuery.updatedAt = { $gte: range.from, $lte: range.to };
  }

  let rows = await ShareholdingHistory.find(shQuery).sort({ updatedAt: -1 }).lean();
  if (panSet) {
    rows = rows.filter((r) => panSet.has(normalizePan(r.pan)));
  }

  const pans = rows.map((r) => normalizePan(r.pan)).filter(Boolean);
  const shareholderMap = {};
  if (pans.length) {
    const shs = await Shareholder.find({ pan: { $in: [...new Set(pans)] } }).lean();
    shs.forEach((s) => {
      shareholderMap[s.pan] = s;
    });
  }

  const credMap = {};
  if (pans.length > 0) {
    const creds = await EmployeeCredentials.find({
      $expr: { $in: [{ $toUpper: '$pan' }, [...new Set(pans)]] },
    }).lean();
    creds.forEach((c) => {
      credMap[normalizePan(c.pan)] = c;
    });
  }

  return rows.map((hist) => {
    const p = normalizePan(hist.pan);
    const identity = shareholderMap[p] || {};
    const c = credMap[p];
    const sh = mergeShareholderAndHistory(identity, hist);
    return { shareholding: sh, credential: c || null };
  });
}

module.exports = {
  upsertShareholding,
  getShareholdingByPan,
  getCombinedByPan,
  listShareholdings,
  deleteByPan,
  deleteHistoryById,
  listShareholdingMISRows,
  fyMonthToUtcRange,
  migrateLegacyShareholdingsIfNeeded,
  mergeShareholderAndHistory,
};
