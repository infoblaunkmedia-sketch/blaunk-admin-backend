const DsaSlider = require('../models/DsaSlider');
const dsaPayoutService = require('./dsaPayoutService');
const dsaService = require('./dsaService');
const planChargesService = require('./planChargesService');
const matchCodeService = require('./matchCodeService');
const cmsPlacements = require('../constants/cmsBannerPlacements');
const giffPlacement = require('./giffPlacementService');

const ALLOWED_STATUSES = new Set(['Draft', 'Active', 'Inactive', 'Expired']);
const UPLOAD_SOURCES = new Set(['vendor_direct', 'admin_3p']);

function resolveUploadTracking(payload, dsaCode) {
  const raw = cleanString(payload?.uploadSource).toLowerCase();
  const uploadSource = UPLOAD_SOURCES.has(raw) ? raw : 'admin_3p';
  if (uploadSource === 'vendor_direct') {
    return { uploadSource, uploadedByDsaCode: null };
  }
  const empCode = cleanString(payload?.uploadedByDsaCode || dsaCode).toUpperCase();
  return { uploadSource: 'admin_3p', uploadedByDsaCode: empCode || null };
}
const ALLOWED_MEDIA_TABS = new Set(['Slider', 'Explore', 'Trendy Star', 'Global Store', 'Exclusive', 'New Launch', 'GIFF', 'Tour Package']);
const ALLOWED_COUNTRIES = new Set(['India', 'Bahrain', 'Bhutan', 'Indonesia', 'Jordan', 'Malaysia', 'Maldives', 'Philippines', 'Singapore', 'Sri Lanka', 'Qatar', 'Thailand', 'UAE-Dubai', 'Vietnam']);

function withResolvedPlacement(doc) {
  if (!doc) return doc;
  const row = { ...doc };
  if (cleanString(row.cmsPage) && cleanString(row.cmsPosition)) return row;
  const migrated = cmsPlacements.migrateLegacySection(row.section);
  if (migrated) {
    row.cmsPage = migrated.cmsPage;
    row.cmsPosition = migrated.cmsPosition;
  }
  return row;
}

function buildPlacementQuery({ cmsPage, cmsPosition, section, mediaTab, country, dsaCode, status, q, excludeId } = {}) {
  const query = {};
  const placement = cmsPlacements.resolvePlacement({ cmsPage, cmsPosition, section });
  if (placement) {
    Object.assign(query, cmsPlacements.placementQueryOr(placement));
  } else if (cleanString(section)) {
    query.section = cleanString(section).toUpperCase();
  }
  if (cleanString(mediaTab)) query.mediaTab = cleanString(mediaTab);
  if (cleanString(country)) query.country = cleanString(country);
  if (cleanString(dsaCode)) query.dsaCode = cleanString(dsaCode).toUpperCase();
  if (cleanString(status) && ALLOWED_STATUSES.has(cleanString(status))) query.status = cleanString(status);
  if (cleanString(q)) {
    const needle = cleanString(q);
    query.$or = [{ productId: { $regex: needle, $options: 'i' } }, { dsaCode: { $regex: needle, $options: 'i' } }];
  }
  return { query, placement, excludeId };
}
const ALLOWED_CATEGORIES = new Set(['Banner', 'Product', 'Service', 'Offer', 'Event']);

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
  if (st === 'Inactive' || st === 'Expired') return false;
  if (st !== 'Active' && st !== 'Draft') return false;
  const exp = doc.expiryDate ? new Date(doc.expiryDate) : null;
  if (exp && !Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) return false;
  return true;
}

async function countOccupiedSlots({ mediaTab, cmsPage, cmsPosition, section, country, excludeId } = {}) {
  const placement = cmsPlacements.resolvePlacement({ cmsPage, cmsPosition, section });
  if (placement?.cmsPage === 'giff') {
    return giffPlacement.countOccupiedGiffCategory(placement.cmsPosition, { excludeId });
  }
  const { query, placement: resolved } = buildPlacementQuery({ mediaTab, cmsPage, cmsPosition, section, country });
  if (!resolved && !query.section) return 0;
  const docs = (await DsaSlider.find(query).select('_id status expiryDate cmsPage cmsPosition section').lean()) || [];
  let n = 0;
  for (const d of docs) {
    if (excludeId && String(d._id) === String(excludeId)) continue;
    if (resolved) {
      const row = withResolvedPlacement(d);
      if (row.cmsPage !== resolved.cmsPage || row.cmsPosition !== resolved.cmsPosition) continue;
    }
    if (occupiesSlot(d)) n += 1;
  }
  return n;
}

async function assertSlotAvailable({ mediaTab, cmsPage, cmsPosition, section, country, excludeId, willOccupy }) {
  if (!willOccupy) return;
  const placement = cmsPlacements.resolvePlacement({ cmsPage, cmsPosition, section });
  if (!placement) throw new Error('Invalid CMS placement.');
  const maxSlots = cmsPlacements.maxSlotsForPlacement(placement.cmsPage, placement.cmsPosition);
  const used = await countOccupiedSlots({
    mediaTab,
    cmsPage: placement.cmsPage,
    cmsPosition: placement.cmsPosition,
    country,
    excludeId,
  });
  if (used >= maxSlots) {
    throw new Error('All slots are full for this placement.');
  }
}

async function getSlotStatus({ mediaTab, cmsPage, cmsPosition, section, country } = {}) {
  const mt = cleanString(mediaTab) || 'Slider';
  const ctry = cleanString(country) || 'India';
  const placement = cmsPlacements.resolvePlacement({ cmsPage, cmsPosition, section })
    || { cmsPage: 'home', cmsPosition: 'hero' };
  const maxSlots = cmsPlacements.maxSlotsForPlacement(placement.cmsPage, placement.cmsPosition);
  const usedSlots = await countOccupiedSlots({
    mediaTab: mt,
    cmsPage: placement.cmsPage,
    cmsPosition: placement.cmsPosition,
    country: ctry,
  });
  const legacySection = cmsPlacements.legacySectionFromPlacement(placement.cmsPage, placement.cmsPosition);
  return {
    mediaTab: mt,
    cmsPage: placement.cmsPage,
    cmsPosition: placement.cmsPosition,
    pageLabel: cmsPlacements.pageLabel(placement.cmsPage),
    slotLabel: cmsPlacements.slotLabel(placement.cmsPage, placement.cmsPosition),
    section: legacySection,
    country: ctry,
    maxSlots,
    usedSlots,
  };
}

async function normalizePayload(payload, prev = null) {
  const mediaTab = cleanString(payload.mediaTab || prev?.mediaTab || 'Slider');
  if (!ALLOWED_MEDIA_TABS.has(mediaTab)) throw new Error('mediaTab is invalid');

  const imageUrl = cleanString(payload.imageUrl || prev?.imageUrl);
  if (!imageUrl) throw new Error('imageUrl is required');

  const placement = cmsPlacements.resolvePlacement({
    cmsPage: payload.cmsPage ?? prev?.cmsPage,
    cmsPosition: payload.cmsPosition ?? prev?.cmsPosition,
    section: payload.section ?? prev?.section,
  });
  if (!placement) throw new Error('Invalid CMS page or slot.');

  const country = cleanString(payload.country || prev?.country || 'India');
  if (!ALLOWED_COUNTRIES.has(country)) throw new Error('country is invalid');

  const category = cleanString(payload.category || prev?.category || '');
  if (!category) throw new Error('category is required');
  if (!ALLOWED_CATEGORIES.has(category)) throw new Error('category is invalid');

  const matchCode = cleanString(payload.matchCode || prev?.matchCode || '');
  if (!matchCode) throw new Error('matchCode is required');

  const rawPlan = cleanString(payload.plan || prev?.plan || '');
  const canonicalPlan = planChargesService.resolvePlanName(rawPlan);
  const durationMonths = await planChargesService.getDurationMonthsForPlan(rawPlan);
  if (!durationMonths) throw new Error('Invalid plan selected');

  const productId = cleanString(payload.productId || prev?.productId || '');

  const planCharge = parseAmount(payload.planCharge ?? prev?.planCharge ?? 0, 'planCharge');
  const luxuryFees = parseAmount(payload.luxuryFees ?? prev?.luxuryFees ?? 0, 'luxuryFees');
  const discount = parseAmount(payload.discount ?? prev?.discount ?? 0, 'discount');
  const toPay = Number((planCharge + luxuryFees - discount).toFixed(2));
  if (toPay < 0) throw new Error('discount cannot exceed planCharge + luxuryFees');

  const status = cleanString(payload.status || prev?.status || 'Draft');
  if (!ALLOWED_STATUSES.has(status)) throw new Error('status must be Draft, Active, Inactive or Expired');

  const uploadDate = prev?.uploadDate || new Date();
  const expiryDate = addMonths(uploadDate, durationMonths);
  if (expiryDate < uploadDate) throw new Error('expiryDate cannot be earlier than uploadDate');

  const section = cmsPlacements.legacySectionFromPlacement(placement.cmsPage, placement.cmsPosition);

  const isGiff = placement.cmsPage === 'giff';
  const resolvedMediaTab = isGiff ? 'GIFF' : mediaTab;

  let giffFormat = '';
  let giffSortOrder = 1;
  if (isGiff) {
    giffFormat = giffPlacement.assertGiffFormat(payload?.giffFormat ?? prev?.giffFormat ?? 'gif');
    const requestedOrder = Number(payload?.giffSortOrder ?? prev?.giffSortOrder);
    if (Number.isFinite(requestedOrder) && requestedOrder >= 1) {
      giffSortOrder = Math.floor(requestedOrder);
    } else if (!prev) {
      giffSortOrder = await giffPlacement.nextAvailableGiffSortOrder(placement.cmsPosition);
    } else {
      giffSortOrder = Number(prev.giffSortOrder) || 1;
    }
  }

  return {
    mediaTab: resolvedMediaTab,
    imageUrl,
    cmsPage: placement.cmsPage,
    cmsPosition: placement.cmsPosition,
    section,
    country,
    category,
    plan: canonicalPlan || rawPlan,
    productId,
    matchCode,
    planCharge,
    luxuryFees,
    discount,
    toPay,
    status,
    uploadDate,
    expiryDate,
    giffFormat,
    giffSortOrder,
  };
}

async function listSliders({
  mediaTab,
  cmsPage,
  cmsPosition,
  section,
  country,
  status,
  q,
  dsaCode,
  limit = 200,
  adminPanelOnly = false,
} = {}) {
  const { query } = buildPlacementQuery({ mediaTab, cmsPage, cmsPosition, section, country, status, q, dsaCode });
  const codeFilter = cleanString(dsaCode).toUpperCase();

  if (adminPanelOnly) {
    const websiteCodes = await dsaService.getWebsiteDsaCodes();
    if (websiteCodes.length) {
      if (codeFilter) {
        if (websiteCodes.includes(codeFilter)) return [];
      } else {
        query.dsaCode = { $nin: websiteCodes };
      }
    }
  }

  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 200, 1), 1000);
  const rows = (await DsaSlider.find(query).sort({ updatedAt: -1 }).limit(safeLimit).lean()) || [];
  return rows.map(withResolvedPlacement);
}

async function getSliderById(id) {
  const doc = await DsaSlider.findById(id).lean();
  return withResolvedPlacement(doc);
}

async function createSlider(payload) {
  const matchCode = cleanString(payload?.matchCode);
  const validCode = await matchCodeService.validateCode(matchCode);
  if (!validCode) throw new Error('Match code is invalid');

  const set = await normalizePayload(payload);
  const dsaCode = cleanString(payload?.dsaCode || '').toUpperCase();
  if (!dsaCode) throw new Error('dsaCode is required');
  const tracking = resolveUploadTracking(payload, dsaCode);
  const skipAdminPanelDsaCheck = payload?.bypassAdminPanelDsaCheck === true;
  if (tracking.uploadSource === 'admin_3p' && !skipAdminPanelDsaCheck) {
    const allowed = await dsaService.isAdminPanelDsa(dsaCode);
    if (!allowed) {
      throw new Error('DSA is not authorized for admin panel uploads.');
    }
  }
  const willOccupy = occupiesSlot({ ...set, _id: null });
  await assertSlotAvailable({
    mediaTab: set.mediaTab,
    cmsPage: set.cmsPage,
    cmsPosition: set.cmsPosition,
    country: set.country,
    excludeId: null,
    willOccupy,
  });
  const doc = await DsaSlider.create({ ...set, dsaCode, ...tracking });
  return doc.toObject();
}

async function updateSlider(id, payload) {
  const prev = await DsaSlider.findById(id).lean();
  if (!prev) return null;
  const matchCode = cleanString(payload?.matchCode || prev?.matchCode || '');
  const validCode = await matchCodeService.validateCode(matchCode);
  if (!validCode) throw new Error('Match code is invalid');
  const set = await normalizePayload(payload, prev);
  const dsaCode = cleanString(payload?.dsaCode || prev.dsaCode || '').toUpperCase();
  if (!dsaCode) throw new Error('dsaCode is required');
  const tracking = resolveUploadTracking(
    { uploadSource: payload?.uploadSource ?? prev.uploadSource, uploadedByDsaCode: payload?.uploadedByDsaCode ?? prev.uploadedByDsaCode },
    dsaCode,
  );
  const skipAdminPanelDsaCheck = payload?.bypassAdminPanelDsaCheck === true;
  if (tracking.uploadSource === 'admin_3p' && !skipAdminPanelDsaCheck) {
    const allowed = await dsaService.isAdminPanelDsa(dsaCode);
    if (!allowed) {
      throw new Error('DSA is not authorized for admin panel uploads.');
    }
  }
  const willOccupy = occupiesSlot({ ...set, _id: id });
  await assertSlotAvailable({
    mediaTab: set.mediaTab,
    cmsPage: set.cmsPage,
    cmsPosition: set.cmsPosition,
    country: set.country,
    excludeId: id,
    willOccupy,
  });
  return DsaSlider.findOneAndUpdate(
    { _id: id },
    { $set: { ...set, dsaCode, ...tracking } },
    { returnDocument: 'after', runValidators: true },
  ).lean();
}

async function deleteSlider(id) {
  const res = await DsaSlider.deleteOne({ _id: id });
  return res.deletedCount || 0;
}

async function listActiveBySlot({
  mediaTab = 'Slider',
  cmsPage,
  cmsPosition,
  section,
  country,
} = {}) {
  const placement = cmsPlacements.resolvePlacement({ cmsPage, cmsPosition, section });
  if (!placement) {
    throw new Error('Invalid CMS placement. Use cmsPage and cmsPosition (or legacy section).');
  }
  const now = new Date();
  const query = {
    mediaTab: cleanString(mediaTab) || 'Slider',
    status: 'Active',
    $and: [
      cmsPlacements.placementQueryOr(placement),
      { uploadDate: { $lte: now } },
      { expiryDate: { $gte: now } },
    ],
  };
  if (cleanString(country)) query.country = cleanString(country);
  const rows = (await DsaSlider.find(query).sort({ updatedAt: -1 }).lean()) || [];
  return rows.map(withResolvedPlacement);
}

async function listActiveGiffByCategory({ category } = {}) {
  const cat = giffPlacement.getGiffCategory(category);
  if (!cat) {
    throw new Error('Invalid GIFF category.');
  }
  const now = new Date();
  const query = {
    mediaTab: 'GIFF',
    cmsPage: 'giff',
    cmsPosition: cat.id,
    status: 'Active',
    $and: [
      { uploadDate: { $lte: now } },
      { expiryDate: { $gte: now } },
    ],
  };
  const rows = (await DsaSlider.find(query).sort({ giffSortOrder: 1, updatedAt: -1 }).lean()) || [];
  return rows.map(withResolvedPlacement);
}

async function getSummary({ dsaCode } = {}) {
  const code = cleanString(dsaCode).toUpperCase();
  if (!code) {
    return {
      totalMargin: 0,
      marginUsed: 0,
      availableMargin: 0,
      companyName: '',
      dsaName: '',
      country: '',
      shareRatio: 30,
    };
  }
  const records = await DsaSlider.find({ dsaCode: code }).select('toPay status').lean();
  const marginUsed = (records || [])
    .filter((r) => r.status === 'Active' || r.status === 'Draft')
    .reduce((sum, r) => sum + Number(r.toPay || 0), 0);
  const totalMargin = await dsaPayoutService.getApprovedAvailableBalanceForDsa(code);
  const profile = await dsaService.getDsaProfileByCode(code);
  const companyName = String(profile.companyName || '').trim();
  return {
    totalMargin: Number(totalMargin.toFixed(2)),
    marginUsed: Number(marginUsed.toFixed(2)),
    availableMargin: Number((totalMargin - marginUsed).toFixed(2)),
    companyName,
    dsaName: companyName,
    country: profile.country || '',
    shareRatio: profile.shareRatio || 30,
  };
}

module.exports = {
  listSliders,
  getSliderById,
  createSlider,
  updateSlider,
  deleteSlider,
  listActiveBySlot,
  listActiveGiffByCategory,
  getSummary,
  getSlotStatus,
  occupiesSlot,
  countOccupiedSlots,
};

