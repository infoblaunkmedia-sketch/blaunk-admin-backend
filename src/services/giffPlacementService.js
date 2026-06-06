const Giff = require('../models/Giff');
const DsaSlider = require('../models/DsaSlider');
const {
  getGiffCategory,
  maxRecordsForCategory,
  GIFF_FORMATS,
} = require('../constants/giffCategories');

function clean(v) {
  return String(v == null ? '' : v).trim();
}

function normalizeGiffFormat(raw) {
  const v = clean(raw).toLowerCase();
  if (v === 'jpeg') return 'jpg';
  if (v === 'jpg' || v === 'gif') return v;
  return 'gif';
}

function dsaOccupiesGiffSlot(doc) {
  if (!doc) return false;
  const st = clean(doc.status);
  if (st === 'Inactive' || st === 'Expired') return false;
  if (st !== 'Active' && st !== 'Draft') return false;
  const exp = doc.expiryDate ? new Date(doc.expiryDate) : null;
  if (exp && !Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return false;
  return true;
}

async function countOccupiedGiffCategory(category, { excludeId } = {}) {
  const cat = getGiffCategory(category);
  if (!cat) return 0;

  const cmsCount = await Giff.countDocuments({ category: cat.id, isActive: true });

  const now = new Date();
  const dsaDocs = await DsaSlider.find({
    mediaTab: 'GIFF',
    cmsPage: 'giff',
    cmsPosition: cat.id,
    status: { $in: ['Active', 'Draft'] },
    uploadDate: { $lte: now },
    expiryDate: { $gte: now },
  }).select('_id status expiryDate').lean();

  let dsaCount = 0;
  for (const doc of dsaDocs || []) {
    if (excludeId && String(doc._id) === String(excludeId)) continue;
    if (dsaOccupiesGiffSlot(doc)) dsaCount += 1;
  }

  return cmsCount + dsaCount;
}

async function nextAvailableGiffSortOrder(category, { excludeId } = {}) {
  const cat = getGiffCategory(category);
  if (!cat) return 1;
  const max = cat.maxRecords || 1;

  const cmsOrders = (await Giff.find({ category: cat.id, isActive: true }).select('sortOrder').lean())
    .map((d) => Number(d.sortOrder) || 1);
  const dsaOrders = (await DsaSlider.find({
    mediaTab: 'GIFF',
    cmsPage: 'giff',
    cmsPosition: cat.id,
    status: { $in: ['Active', 'Draft'] },
  }).select('giffSortOrder _id').lean())
    .filter((d) => !excludeId || String(d._id) !== String(excludeId))
    .map((d) => Number(d.giffSortOrder) || 1);

  const used = new Set([...cmsOrders, ...dsaOrders]);
  for (let n = 1; n <= max; n += 1) {
    if (!used.has(n)) return n;
  }
  return 1;
}

function assertGiffFormat(format) {
  const f = normalizeGiffFormat(format);
  if (!GIFF_FORMATS.has(f)) throw new Error('format must be gif or jpg.');
  return f;
}

module.exports = {
  countOccupiedGiffCategory,
  nextAvailableGiffSortOrder,
  normalizeGiffFormat,
  assertGiffFormat,
  maxRecordsForCategory,
  getGiffCategory,
  dsaOccupiesGiffSlot,
};
