const DsaSlider = require('../models/DsaSlider');
const mediaSlotConfigService = require('./mediaSlotConfigService');
const dsaPayoutService = require('./dsaPayoutService');

const ALLOWED_STATUSES = new Set(['Draft', 'Active', 'Inactive']);
const ALLOWED_MEDIA_TABS = new Set(['Slider', 'Explore', 'Trendy Star', 'Global Store', 'Exclusive', 'New Launch', 'GIFF', 'Tour Package']);
const ALLOWED_SECTIONS = new Set(['HOMEPAGE', 'BGT', 'TOUR', 'STORE', 'CAKE', 'BOUTIQUE', 'LOGISTIC']);
const ALLOWED_COUNTRIES = new Set(['India', 'Bahrain', 'Bhutan', 'Indonesia', 'Jordan', 'Malaysia', 'Maldives', 'Philippines', 'Singapore', 'Sri Lanka', 'Qatar', 'Thailand', 'UAE-Dubai', 'Vietnam']);
const ALLOWED_CATEGORIES = new Set(['Banner', 'Product', 'Service', 'Offer', 'Event']);
const PLAN_MONTHS = { 'Standard (2M)': 2, 'Silver (3M)': 3, 'Gold (6M)': 6, 'Platinum (1YR)': 12, 'Premium (1YR)': 12, 'Diamond (1YR)': 12 };
const PLAN_NAMES = new Set(Object.keys(PLAN_MONTHS));

function cleanString(v) { return String(v == null ? '' : v).trim(); }
function parseDate(v) { if (!v) return null; const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
function parseAmount(v, field) {
  const num = Number(v);
  if (!Number.isFinite(num) || num < 0) throw new Error(`${field} must be a non-negative number`);
  return Number(num.toFixed(2));
}
function addMonths(date, months) { const copy = new Date(date); copy.setMonth(copy.getMonth() + months); return copy; }

function occupiesSlot(doc) {
  if (!doc) return false;
  const st = cleanString(doc.status);
  if (st === 'Inactive') return false;
  if (st !== 'Active' && st !== 'Draft') return false;
  const exp = doc.expiryDate ? new Date(doc.expiryDate) : null;
  if (exp && !Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return false;
  return true;
}

async function countOccupiedSlots({ mediaTab, section, country, excludeId } = {}) {
  const mt = cleanString(mediaTab);
  const sec = cleanString(section).toUpperCase();
  const ctry = cleanString(country);
  const query = { mediaTab: mt, section: sec, country: ctry };
  const docs = (await DsaSlider.find(query).select('_id status expiryDate').lean()) || [];
  let n = 0;
  for (const d of docs) {
    if (excludeId && String(d._id) === String(excludeId)) continue;
    if (occupiesSlot(d)) n += 1;
  }
  return n;
}

async function assertSlotAvailable({ mediaTab, section, country, excludeId, willOccupy }) {
  if (!willOccupy) return;
  const maxSlots = await mediaSlotConfigService.getMaxSlotsForTab(mediaTab);
  const used = await countOccupiedSlots({ mediaTab, section, country, excludeId });
  if (used >= maxSlots) {
    throw new Error('All slots are full for this section.');
  }
}

async function getSlotStatus({ mediaTab, section, country } = {}) {
  const mt = cleanString(mediaTab) || 'Slider';
  const sec = cleanString(section).toUpperCase() || 'HOMEPAGE';
  const ctry = cleanString(country) || 'India';
  const maxSlots = await mediaSlotConfigService.getMaxSlotsForTab(mt);
  const usedSlots = await countOccupiedSlots({ mediaTab: mt, section: sec, country: ctry });
  return { mediaTab: mt, section: sec, country: ctry, maxSlots, usedSlots };
}

function normalizePayload(payload, prev = null) {
  const mediaTab = cleanString(payload.mediaTab || prev?.mediaTab || 'Slider');
  if (!ALLOWED_MEDIA_TABS.has(mediaTab)) throw new Error('mediaTab is invalid');

  const imageUrl = cleanString(payload.imageUrl || prev?.imageUrl);
  if (!imageUrl) throw new Error('imageUrl is required');

  const section = cleanString(payload.section || prev?.section || 'HOMEPAGE').toUpperCase();
  if (!ALLOWED_SECTIONS.has(section)) throw new Error('section is invalid');

  const country = cleanString(payload.country || prev?.country || 'India');
  if (!ALLOWED_COUNTRIES.has(country)) throw new Error('country is invalid');

  const category = cleanString(payload.category || prev?.category || '');
  if (!category) throw new Error('category is required');
  if (!ALLOWED_CATEGORIES.has(category)) throw new Error('category is invalid');

  const matchCode = cleanString(payload.matchCode || prev?.matchCode || '');
  if (!matchCode) throw new Error('matchCode is required');

  const plan = cleanString(payload.plan || prev?.plan || 'Standard (2M)');
  if (!PLAN_NAMES.has(plan)) throw new Error('plan is invalid');

  const productId = cleanString(payload.productId || prev?.productId || '');

  const planCharge = parseAmount(payload.planCharge ?? prev?.planCharge ?? 0, 'planCharge');
  const luxuryFees = parseAmount(payload.luxuryFees ?? prev?.luxuryFees ?? 0, 'luxuryFees');
  const discount = parseAmount(payload.discount ?? prev?.discount ?? 0, 'discount');
  const toPay = Number((planCharge + luxuryFees - discount).toFixed(2));
  if (toPay < 0) throw new Error('discount cannot exceed planCharge + luxuryFees');

  const status = cleanString(payload.status || prev?.status || 'Draft');
  if (!ALLOWED_STATUSES.has(status)) throw new Error('status must be Draft, Active or Inactive');

  const uploadDate = parseDate(payload.uploadDate) || prev?.uploadDate || new Date();
  const expiryDate = parseDate(payload.expiryDate) || addMonths(uploadDate, PLAN_MONTHS[plan]);
  if (expiryDate < uploadDate) throw new Error('expiryDate cannot be earlier than uploadDate');

  return { mediaTab, imageUrl, section, country, category, plan, productId, matchCode, planCharge, luxuryFees, discount, toPay, status, uploadDate, expiryDate };
}

async function listSliders({ mediaTab, section, country, status, q, limit = 200 } = {}) {
  const query = {};
  if (cleanString(mediaTab)) query.mediaTab = cleanString(mediaTab);
  if (cleanString(section)) query.section = cleanString(section).toUpperCase();
  if (cleanString(country)) query.country = cleanString(country);
  if (cleanString(status) && ALLOWED_STATUSES.has(cleanString(status))) query.status = cleanString(status);
  if (cleanString(q)) {
    const needle = cleanString(q);
    query.$or = [{ productId: { $regex: needle, $options: 'i' } }, { dsaCode: { $regex: needle, $options: 'i' } }];
  }
  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);
  return (await DsaSlider.find(query).sort({ updatedAt: -1 }).limit(safeLimit).lean()) || [];
}

async function getSliderById(id) { return DsaSlider.findById(id).lean(); }

async function createSlider(payload) {
  const set = normalizePayload(payload);
  const dsaCode = cleanString(payload?.dsaCode || '');
  if (!dsaCode) throw new Error('dsaCode is required');
  const willOccupy = occupiesSlot({ ...set, _id: null });
  await assertSlotAvailable({
    mediaTab: set.mediaTab,
    section: set.section,
    country: set.country,
    excludeId: null,
    willOccupy,
  });
  const doc = await DsaSlider.create({ ...set, dsaCode });
  return doc.toObject();
}

async function updateSlider(id, payload) {
  const prev = await DsaSlider.findById(id).lean();
  if (!prev) return null;
  const set = normalizePayload(payload, prev);
  const dsaCode = cleanString(payload?.dsaCode || prev.dsaCode || '');
  if (!dsaCode) throw new Error('dsaCode is required');
  const willOccupy = occupiesSlot({ ...set, _id: id });
  await assertSlotAvailable({
    mediaTab: set.mediaTab,
    section: set.section,
    country: set.country,
    excludeId: id,
    willOccupy,
  });
  return DsaSlider.findOneAndUpdate(
    { _id: id },
    { $set: { ...set, dsaCode } },
    { returnDocument: 'after', runValidators: true },
  ).lean();
}

async function deleteSlider(id) {
  const res = await DsaSlider.deleteOne({ _id: id });
  return res.deletedCount || 0;
}

async function listActiveBySlot({ mediaTab = 'Slider', section = 'HOMEPAGE', country } = {}) {
  const now = new Date();
  const query = {
    mediaTab: cleanString(mediaTab) || 'Slider',
    section: cleanString(section).toUpperCase() || 'HOMEPAGE',
    status: 'Active',
    $and: [{ uploadDate: { $lte: now } }, { expiryDate: { $gte: now } }],
  };
  if (cleanString(country)) query.country = cleanString(country);
  return (await DsaSlider.find(query).sort({ updatedAt: -1 }).lean()) || [];
}

async function getSummary({ mediaTab, section, country, dsaCode } = {}) {
  const query = {};
  if (cleanString(mediaTab)) query.mediaTab = cleanString(mediaTab);
  if (cleanString(section)) query.section = cleanString(section).toUpperCase();
  if (cleanString(country)) query.country = cleanString(country);
  if (cleanString(dsaCode)) query.dsaCode = cleanString(dsaCode);
  const records = await DsaSlider.find(query).select('toPay status').lean();
  const marginUsed = (records || []).filter((r) => r.status === 'Active' || r.status === 'Draft').reduce((sum, r) => sum + Number(r.toPay || 0), 0);
  const totalMargin = cleanString(dsaCode)
    ? await dsaPayoutService.getApprovedAvailableBalanceForDsa(cleanString(dsaCode))
    : 0;
  return {
    totalMargin: Number(totalMargin.toFixed(2)),
    marginUsed: Number(marginUsed.toFixed(2)),
    availableMargin: Number((totalMargin - marginUsed).toFixed(2)),
  };
}

module.exports = {
  listSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  listActiveBySlot,
  getSummary,
  getSlotStatus,
  occupiesSlot,
  countOccupiedSlots,
};

