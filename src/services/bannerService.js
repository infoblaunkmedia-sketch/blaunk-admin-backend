const Banner = require('../models/Banner');
const {
  HOMEPAGE_BANNER_POSITIONS,
  INDUSTRY_VARIANTS,
  CAKE_IMAGE_FORMATS,
  CAKE_UPLOAD_SECTION,
  CAKE_UPLOAD_SLOT_KEYS,
  imageRequiredForPosition,
  isSingleRecordPosition,
  maxRecordsForPosition,
} = require('../constants/homepageBannerPositions');

function clean(v) {
  return String(v == null ? '' : v).trim();
}

function isActiveNow(doc) {
  if (!doc.isActive) return false;
  const now = Date.now();
  if (doc.startDate && new Date(doc.startDate).getTime() > now) return false;
  if (doc.endDate && new Date(doc.endDate).getTime() < now) return false;
  return true;
}

function normalizeFocalPoint(raw) {
  if (!raw || typeof raw !== 'object') return { x: 50, y: 50 };
  const x = Number(raw.x);
  const y = Number(raw.y);
  return {
    x: Number.isFinite(x) ? Math.min(100, Math.max(0, x)) : 50,
    y: Number.isFinite(y) ? Math.min(100, Math.max(0, y)) : 50,
  };
}

function normalizeCakeFormat(variant) {
  const v = clean(variant).toLowerCase();
  if (v === 'jpeg') return 'jpg';
  if (v === 'jpg' || v === 'gif') return v;
  return 'gif';
}

function cakeSlotFromSortOrder(sortOrder) {
  const n = Number(sortOrder) || 0;
  const slot = n === 2 ? 2 : 1;
  return {
    slot,
    slotKey: CAKE_UPLOAD_SLOT_KEYS[slot] || 'left',
    sortOrder: slot,
  };
}

/** Cake GIFF — admin CMS list (includes format for GIF/JPG). */
function toCakeUploadDto(doc, { includeActive = true } = {}) {
  const { slot, slotKey, sortOrder } = cakeSlotFromSortOrder(doc.sortOrder);
  const format = normalizeCakeFormat(doc.variant);
  const dto = {
    id: String(doc._id),
    position: CAKE_UPLOAD_SECTION.position,
    section: CAKE_UPLOAD_SECTION.section,
    sectionLabel: CAKE_UPLOAD_SECTION.sectionLabel,
    slot,
    slotKey,
    imageUrl: doc.imageUrl || '',
    format,
    /** @deprecated use `format` — kept for admin CMS compatibility */
    variant: format,
    sortOrder,
  };
  if (includeActive) dto.isActive = !!doc.isActive;
  return dto;
}

/** Cake GIFF — public API (flat record, no title/linkUrl). */
function toCakeUploadPublicDto(doc) {
  const { sortOrder } = cakeSlotFromSortOrder(doc.sortOrder);
  return {
    id: String(doc._id),
    page: clean(doc.page).toLowerCase() || 'home',
    position: CAKE_UPLOAD_SECTION.position,
    sortOrder,
    imageUrl: doc.imageUrl || '',
    isActive: !!doc.isActive,
  };
}

function buildCakeUploadSectionLayout(records) {
  const layout = { left: null, right: null };
  for (const record of records) {
    const key = record.slotKey === 'right' ? 'right' : 'left';
    layout[key] = record;
  }
  return layout;
}

function wrapCakeUploadListResponse(records) {
  return {
    ...CAKE_UPLOAD_SECTION,
    records,
    sectionLayout: buildCakeUploadSectionLayout(records),
  };
}

function toFullDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    page: doc.page,
    position: doc.position,
    title: doc.title || '',
    imageUrl: doc.imageUrl || '',
    linkUrl: doc.linkUrl || '',
    tag: doc.tag || '',
    subtitle: doc.subtitle || '',
    ctaText: doc.ctaText || '',
    titleAccent: doc.titleAccent || '',
    description: doc.description || '',
    overlayQuote: doc.overlayQuote || '',
    variant: doc.variant || '',
    focalPoint: fp,
    isActive: !!doc.isActive,
    startDate: doc.startDate ?? null,
    endDate: doc.endDate ?? null,
    sortOrder: doc.sortOrder || 0,
    createdAt: doc.createdAt,
  };
}

function toDto(doc) {
  const position = clean(doc.position).toLowerCase();
  if (position === 'cake-upload') return toCakeUploadDto(doc, { includeActive: true });
  return toFullDto(doc);
}

function toPublicDto(doc) {
  const position = clean(doc.position).toLowerCase();
  if (position === 'cake-upload') return toCakeUploadPublicDto(doc);
  return toFullDto(doc);
}

function assertPosition(position) {
  const pos = clean(position).toLowerCase();
  if (!HOMEPAGE_BANNER_POSITIONS.includes(pos)) {
    throw new Error(`position must be one of: ${HOMEPAGE_BANNER_POSITIONS.join(', ')}`);
  }
  return pos;
}

function buildCakeUploadPayload(payload, { partial = false } = {}) {
  const updates = {};
  const set = (key, value) => {
    if (partial && payload[key] === undefined) return;
    updates[key] = value;
  };

  if (!partial || payload.page != null) set('page', clean(payload.page).toLowerCase() || 'home');
  if (!partial || payload.position != null) set('position', 'cake-upload');
  if (!partial || payload.imageUrl != null) set('imageUrl', clean(payload.imageUrl));
  if (!partial || payload.variant != null || payload.format != null) {
    set('variant', normalizeCakeFormat(payload.format ?? payload.variant));
  }
  if (!partial || payload.isActive != null) updates.isActive = payload.isActive !== false;
  if (!partial || payload.sortOrder != null) {
    updates.sortOrder = Number(payload.sortOrder) || 0;
  }

  return updates;
}

function buildPayload(payload, { partial = false, existingPosition } = {}) {
  const resolvedPosition = partial && existingPosition
    ? clean(existingPosition).toLowerCase()
    : clean(payload.position || '').toLowerCase();

  if (resolvedPosition === 'cake-upload') {
    return buildCakeUploadPayload(payload, { partial });
  }

  const updates = {};
  const set = (key, value) => {
    if (partial && payload[key] === undefined) return;
    updates[key] = value;
  };

  if (!partial || payload.page != null) {
    set('page', clean(payload.page).toLowerCase() || 'home');
  }
  if (!partial || payload.position != null) {
    updates.position = assertPosition(payload.position || 'hero');
  }
  if (!partial || payload.title != null) set('title', clean(payload.title));
  if (!partial || payload.imageUrl != null) set('imageUrl', clean(payload.imageUrl));
  if (!partial || payload.linkUrl != null) set('linkUrl', clean(payload.linkUrl));
  if (!partial || payload.tag != null) set('tag', clean(payload.tag));
  if (!partial || payload.subtitle != null) set('subtitle', clean(payload.subtitle));
  if (!partial || payload.ctaText != null) set('ctaText', clean(payload.ctaText));
  if (!partial || payload.titleAccent != null) set('titleAccent', clean(payload.titleAccent));
  if (!partial || payload.description != null) set('description', clean(payload.description));
  if (!partial || payload.overlayQuote != null) set('overlayQuote', clean(payload.overlayQuote));
  if (!partial || payload.variant != null) {
    const v = clean(payload.variant).toLowerCase();
    if (v && INDUSTRY_VARIANTS.has(v)) updates.variant = v;
    else if (v && CAKE_IMAGE_FORMATS.has(v)) updates.variant = v === 'jpeg' ? 'jpg' : v;
    else updates.variant = clean(payload.variant);
  }
  if (!partial || payload.focalPoint != null) {
    updates.focalPoint = normalizeFocalPoint(payload.focalPoint);
  }
  if (!partial || payload.isActive != null) updates.isActive = payload.isActive !== false;
  if (!partial || payload.startDate !== undefined) {
    updates.startDate = payload.startDate ? new Date(payload.startDate) : null;
  }
  if (!partial || payload.endDate !== undefined) {
    updates.endDate = payload.endDate ? new Date(payload.endDate) : null;
  }
  if (!partial || payload.sortOrder != null) {
    updates.sortOrder = Number(payload.sortOrder) || 0;
  }

  return updates;
}

function assertImageRequired(position, imageUrl) {
  if (!imageRequiredForPosition(position)) return;
  if (!clean(imageUrl)) throw new Error('imageUrl is required for this position.');
}

async function listBanners({ page: pageFilter, position } = {}) {
  const query = {};
  if (clean(pageFilter)) query.page = clean(pageFilter).toLowerCase();
  const pos = clean(position).toLowerCase();
  if (pos) query.position = pos;
  const rows = await Banner.find(query).sort({ position: 1, sortOrder: 1, createdAt: -1 }).lean();
  const records = rows.map(toDto);
  if (pos === 'cake-upload') return wrapCakeUploadListResponse(records);
  return { records };
}

async function listPublicBanners({ page, position } = {}) {
  const p = clean(page).toLowerCase() || 'home';
  const query = { page: p };
  const pos = clean(position).toLowerCase();
  if (pos) query.position = pos;
  const rows = await Banner.find(query).sort({ position: 1, sortOrder: 1 }).lean();
  const records = rows.filter(isActiveNow).map(toPublicDto);
  return { records };
}

async function createBanner(payload) {
  const data = buildPayload(payload);
  const position = data.position || assertPosition(payload.position || 'hero');
  data.position = position;
  assertImageRequired(position, data.imageUrl);
  const page = data.page || 'home';
  const existing = await Banner.countDocuments({ page, position });
  const maxRecords = maxRecordsForPosition(position);
  if (maxRecords != null && existing >= maxRecords) {
    const msg =
      maxRecords === 1
        ? 'Only one record is allowed for this position. Edit the existing record instead.'
        : `Maximum ${maxRecords} records are allowed for this position. Edit or delete an existing record first.`;
    throw new Error(msg);
  }
  const doc = await Banner.create(data);
  return toDto(doc.toObject());
}

async function updateBanner(id, payload) {
  const existing = await Banner.findById(id).lean();
  if (!existing) return null;
  const updates = buildPayload(payload, { partial: true, existingPosition: existing.position });
  const position = updates.position || existing.position;
  if (payload.imageUrl !== undefined || imageRequiredForPosition(position)) {
    const nextUrl = updates.imageUrl !== undefined ? updates.imageUrl : existing.imageUrl;
    assertImageRequired(position, nextUrl);
  }
  const doc = await Banner.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' }).lean();
  return doc ? toDto(doc) : null;
}

async function deleteBanner(id) {
  const r = await Banner.findByIdAndDelete(id);
  return !!r;
}

async function ensureSeedBanners() {
  const homeCount = await Banner.countDocuments({ page: 'home' });
  if (homeCount > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'home',
      position: 'hero',
      title: 'Welcome to Blaunk',
      tag: '0% Commission Platform',
      subtitle: 'Direct sourcing from verified manufacturers.',
      ctaText: 'Connect Now',
      linkUrl: 'https://blaunk.com',
      imageUrl: '/uploads/placeholder-hero.jpg',
      focalPoint: { x: 50, y: 45 },
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'home',
      position: 'market-card',
      title: 'BGT Export',
      imageUrl: '/uploads/placeholder-market-1.jpg',
      linkUrl: '/bgt',
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'home',
      position: 'market-card',
      title: 'B-Dial',
      imageUrl: '/uploads/placeholder-market-2.jpg',
      linkUrl: '/bdial',
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'home',
      position: 'trade-hub',
      title: 'Global Trade Hub',
      subtitle: 'Partners',
      imageUrl: '/uploads/placeholder-trade-hub.jpg',
      linkUrl: '/trade',
      isActive: true,
      sortOrder: 1,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

module.exports = {
  listBanners,
  listPublicBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  ensureSeedBanners,
  HOMEPAGE_BANNER_POSITIONS,
};
