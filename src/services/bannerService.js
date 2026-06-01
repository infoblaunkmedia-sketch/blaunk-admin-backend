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
const {
  BGT_COMMON_BANNER_POSITIONS,
  isBgtCommonPage,
  isDiscoveryPosition,
  isBlaunkAdvantagePosition,
  bgtMaxRecordsForPosition,
  bgtImageRequiredForPosition,
} = require('../constants/bgtCommonBannerPositions');
const {
  isBoutiquePage,
  boutiqueMaxRecordsForPosition,
  assertBoutiquePosition,
  isBoutiqueFashionAccessoriesPosition,
  isBoutiqueTrendyStarPosition,
  isBoutiqueHeaderCardPosition,
  isBoutiqueImageSlidePosition,
} = require('../constants/boutiqueBannerPositions');

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

/** Boutique Fashion & Accessories — header (sortOrder 0) or carousel slide (sortOrder 1+). */
function toBoutiqueFashionAccessoriesPublicDto(doc) {
  const sortOrder = Number(doc.sortOrder) || 0;
  if (sortOrder === 0) {
    return {
      id: String(doc._id),
      title: doc.title || '',
      titleAccent: doc.titleAccent || '',
      subtitle: doc.subtitle || '',
      ctaText: doc.ctaText || '',
      linkUrl: doc.linkUrl || '',
      sortOrder: 0,
    };
  }
  const dto = {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder,
  };
  const linkUrl = clean(doc.linkUrl);
  if (linkUrl) dto.linkUrl = linkUrl;
  return dto;
}

/** Boutique Trendy Star — header (sortOrder 0) or carousel card (sortOrder 1+). */
function toBoutiqueTrendyStarPublicDto(doc) {
  const sortOrder = Number(doc.sortOrder) || 0;
  if (sortOrder === 0) {
    return {
      id: String(doc._id),
      title: doc.title || '',
      titleAccent: doc.titleAccent || '',
      subtitle: doc.subtitle || '',
      sortOrder: 0,
    };
  }
  const dto = {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder,
  };
  const linkUrl = clean(doc.linkUrl);
  if (linkUrl) dto.linkUrl = linkUrl;
  return dto;
}

/** Boutique Disclaimer Utility — header (sortOrder 0) or carousel card (sortOrder 1+). */
function toBoutiqueDisclaimerUtilityPublicDto(doc) {
  const sortOrder = Number(doc.sortOrder) || 0;
  if (sortOrder === 0) {
    return {
      id: String(doc._id),
      title: doc.title || '',
      titleAccent: doc.titleAccent || '',
      description: doc.description || '',
      sortOrder: 0,
    };
  }
  const dto = {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder,
  };
  const linkUrl = clean(doc.linkUrl);
  if (linkUrl) dto.linkUrl = linkUrl;
  return dto;
}

/** Boutique Exclusive Video — header (sortOrder 0) or video card (sortOrder 1). */
function toBoutiqueExclusiveVideoPublicDto(doc) {
  const sortOrder = Number(doc.sortOrder) || 0;
  if (sortOrder === 0) {
    return {
      id: String(doc._id),
      title: doc.title || '',
      titleAccent: doc.titleAccent || '',
      sortOrder: 0,
    };
  }
  return {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    subtitle: doc.subtitle || '',
    title: doc.title || '',
    tag: doc.tag || '',
    titleAccent: doc.titleAccent || '',
    description: doc.description || '',
    ctaText: doc.ctaText || '',
    linkUrl: doc.linkUrl || '',
    sortOrder: 1,
  };
}

/** Boutique Editorial Gallery — 2-column card grid (sortOrder 0 = left, 1 = right). */
function toBoutiqueEditorialGalleryPublicDto(doc) {
  const dto = {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder: Number(doc.sortOrder) || 0,
  };
  const linkUrl = clean(doc.linkUrl);
  if (linkUrl) dto.linkUrl = linkUrl;
  return dto;
}

/** Boutique page hero — background carousel (sortOrder 0 = first). */
function toBoutiqueHeroPublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  const dto = {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder: Number(doc.sortOrder) || 0,
    focalPoint: fp,
  };
  const linkUrl = clean(doc.linkUrl);
  if (linkUrl) dto.linkUrl = linkUrl;
  return dto;
}

/** BGT Trading hero carousel — public API contract. */
function toHeroPublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    subtitle: doc.subtitle || '',
    ctaText: doc.ctaText || '',
    linkUrl: doc.linkUrl || '',
    sortOrder: doc.sortOrder || 0,
    focalPoint: fp,
    position: clean(doc.position).toLowerCase(),
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

/** BGT Discovery Hub — header (sortOrder 0) or chip (sortOrder 1+). */
function toDiscoveryHubPublicDto(doc) {
  const sortOrder = Number(doc.sortOrder) || 0;
  const base = {
    id: String(doc._id),
    sortOrder,
    position: clean(doc.position).toLowerCase(),
  };
  if (sortOrder === 0) {
    return {
      ...base,
      tag: doc.tag || '',
      title: doc.title || '',
      subtitle: doc.subtitle || '',
    };
  }
  return {
    ...base,
    title: doc.title || '',
    tag: doc.tag || '',
    linkUrl: doc.linkUrl || '',
  };
}

/** BGT Explore Gallery — one image per record. */
function toExploreGalleryPublicDto(doc) {
  return {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder: Number(doc.sortOrder) || 0,
    position: 'explore-gallery',
    isActive: !!doc.isActive,
  };
}

/** BGT Explorer Carousel — wide landscape slide below Explore Gallery. */
function toExplorerCarouselPublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder: Number(doc.sortOrder) || 0,
    position: 'explorer-carousel',
    focalPoint: fp,
    isActive: !!doc.isActive,
  };
}

/** View More — sponsored trade/export banners. */
function toViewMoreSponsoredAdsPublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    page: 'bgt-trading',
    position: 'view-more-sponsored-ads',
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    linkUrl: doc.linkUrl || '',
    sortOrder: Number(doc.sortOrder) || 0,
    focalPoint: fp,
    isActive: !!doc.isActive,
  };
}

/** View More — large premium showcase banners. */
function toViewMorePremiumShowcasePublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    page: 'bgt-trading',
    position: 'view-more-premium-showcase',
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    linkUrl: doc.linkUrl || '',
    sortOrder: Number(doc.sortOrder) || 0,
    focalPoint: fp,
    isActive: !!doc.isActive,
  };
}

/** View More — sidebar ad slots (image + title + optional link). */
function toViewMoreSidebarAdsPublicDto(doc) {
  const dto = {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder: Number(doc.sortOrder) || 0,
  };
  const linkUrl = clean(doc.linkUrl);
  if (linkUrl) dto.linkUrl = linkUrl;
  return dto;
}

/** View More — single brand footer cinematic banner. */
function toViewMoreBrandFooterPublicDto(doc) {
  return {
    id: String(doc._id),
    page: 'bgt-trading',
    position: 'view-more-brand-footer',
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    titleAccent: doc.titleAccent || '',
    subtitle: doc.subtitle || '',
    tag: doc.tag || '',
    description: doc.description || '',
    sortOrder: 1,
    isActive: !!doc.isActive,
  };
}

/** View More — single deals & offers hero banner. */
function toViewMoreDealsOffersPublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    page: 'bgt-trading',
    position: 'view-more-deals-offers',
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    titleAccent: doc.titleAccent || '',
    subtitle: doc.subtitle || '',
    ctaText: doc.ctaText || '',
    linkUrl: doc.linkUrl || '',
    sortOrder: 1,
    focalPoint: fp,
    isActive: !!doc.isActive,
  };
}

/** View More — trending discovery collection cards. */
function toViewMoreTrendingDiscoveryPublicDto(doc) {
  return {
    id: String(doc._id),
    page: 'bgt-trading',
    position: 'view-more-trending-discovery',
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    linkUrl: doc.linkUrl || '',
    sortOrder: Number(doc.sortOrder) || 0,
    isActive: !!doc.isActive,
  };
}

/** View More listing — short wide strip above search bar. */
function toViewMoreHeroPublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder: Number(doc.sortOrder) || 0,
    position: 'view-more-hero',
    focalPoint: fp,
    isActive: !!doc.isActive,
  };
}

/** International Sourcing — ultra-wide banner above section heading. */
function toInternationalSourcingBannerPublicDto(doc) {
  const fp = normalizeFocalPoint(doc.focalPoint);
  return {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder: Number(doc.sortOrder) || 0,
    position: 'international-sourcing-banner',
    focalPoint: fp,
    isActive: !!doc.isActive,
  };
}

/** Blaunk Exporter Directory — header (description) + advantage cards (image + title). */
function toBlaunkAdvantagePublicDto(doc) {
  const sortOrder = Number(doc.sortOrder) || 0;
  if (sortOrder === 0) {
    return {
      id: String(doc._id),
      description: doc.description || '',
      sortOrder: 0,
    };
  }
  return {
    id: String(doc._id),
    imageUrl: doc.imageUrl || '',
    title: doc.title || '',
    sortOrder,
  };
}

function toPublicDto(doc) {
  const position = clean(doc.position).toLowerCase();
  const page = clean(doc.page).toLowerCase();
  if (position === 'cake-upload') return toCakeUploadPublicDto(doc);
  if (isBgtCommonPage(page) && isBlaunkAdvantagePosition(position)) return toBlaunkAdvantagePublicDto(doc);
  if (isBgtCommonPage(page) && isDiscoveryPosition(position)) return toDiscoveryHubPublicDto(doc);
  if (isBgtCommonPage(page) && position === 'hero') return toHeroPublicDto(doc);
  if (isBgtCommonPage(page) && position === 'explore-gallery') return toExploreGalleryPublicDto(doc);
  if (isBgtCommonPage(page) && position === 'explorer-carousel') return toExplorerCarouselPublicDto(doc);
  if (isBgtCommonPage(page) && position === 'international-sourcing-banner') {
    return toInternationalSourcingBannerPublicDto(doc);
  }
  if (isBgtCommonPage(page) && position === 'view-more-hero') return toViewMoreHeroPublicDto(doc);
  if (isBgtCommonPage(page) && position === 'view-more-sponsored-ads') {
    return toViewMoreSponsoredAdsPublicDto(doc);
  }
  if (isBgtCommonPage(page) && position === 'view-more-premium-showcase') {
    return toViewMorePremiumShowcasePublicDto(doc);
  }
  if (isBgtCommonPage(page) && position === 'view-more-trending-discovery') {
    return toViewMoreTrendingDiscoveryPublicDto(doc);
  }
  if (isBgtCommonPage(page) && position === 'view-more-deals-offers') {
    return toViewMoreDealsOffersPublicDto(doc);
  }
  if (isBgtCommonPage(page) && position === 'view-more-brand-footer') {
    return toViewMoreBrandFooterPublicDto(doc);
  }
  if (isBgtCommonPage(page) && position === 'view-more-sidebar-ads') {
    return toViewMoreSidebarAdsPublicDto(doc);
  }
  if (isBoutiquePage(page) && position === 'hero') return toBoutiqueHeroPublicDto(doc);
  if (isBoutiquePage(page) && isBoutiqueFashionAccessoriesPosition(position)) {
    return toBoutiqueFashionAccessoriesPublicDto(doc);
  }
  if (isBoutiquePage(page) && isBoutiqueTrendyStarPosition(position)) {
    return toBoutiqueTrendyStarPublicDto(doc);
  }
  if (isBoutiquePage(page) && position === 'editorial-gallery') {
    return toBoutiqueEditorialGalleryPublicDto(doc);
  }
  if (isBoutiquePage(page) && position === 'new-launch-carousel') {
    return toBoutiqueEditorialGalleryPublicDto(doc);
  }
  if (isBoutiquePage(page) && position === 'exclusive-video') {
    return toBoutiqueExclusiveVideoPublicDto(doc);
  }
  if (isBoutiquePage(page) && position === 'disclaimer-utility') {
    return toBoutiqueDisclaimerUtilityPublicDto(doc);
  }
  return toFullDto(doc);
}

function assertPositionForPage(position, page) {
  const pos = clean(position).toLowerCase();
  const pg = clean(page).toLowerCase() || 'home';
  if (isBgtCommonPage(pg)) {
    if (!BGT_COMMON_BANNER_POSITIONS.includes(pos)) {
      throw new Error(`position must be one of: ${BGT_COMMON_BANNER_POSITIONS.join(', ')}`);
    }
    return pos;
  }
  if (isBoutiquePage(pg)) return assertBoutiquePosition(pos);
  if (!HOMEPAGE_BANNER_POSITIONS.includes(pos)) {
    throw new Error(`position must be one of: ${HOMEPAGE_BANNER_POSITIONS.join(', ')}`);
  }
  return pos;
}

function resolveMaxRecords(page, position) {
  if (isBgtCommonPage(page)) return bgtMaxRecordsForPosition(position);
  if (isBoutiquePage(page)) return boutiqueMaxRecordsForPosition(position);
  return maxRecordsForPosition(position);
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

function buildPayload(payload, { partial = false, existingPosition, existingPage } = {}) {
  const resolvedPosition = partial && existingPosition
    ? clean(existingPosition).toLowerCase()
    : clean(payload.position || '').toLowerCase();

  if (resolvedPosition === 'cake-upload') {
    return buildCakeUploadPayload(payload, { partial });
  }

  const pageCtx = clean(payload.page).toLowerCase() || clean(existingPage).toLowerCase() || 'home';

  const updates = {};
  const set = (key, value) => {
    if (partial && payload[key] === undefined) return;
    updates[key] = value;
  };

  if (!partial || payload.page != null) {
    set('page', clean(payload.page).toLowerCase() || 'home');
  }
  if (!partial || payload.position != null) {
    updates.position = assertPositionForPage(payload.position || 'hero', pageCtx);
  }
  if (!partial || payload.title != null) set('title', clean(payload.title));
  if (!partial || payload.imageUrl != null) set('imageUrl', clean(payload.imageUrl));
  if (!partial || payload.linkUrl != null || payload.ctaLink != null) {
    updates.linkUrl = clean(payload.linkUrl ?? payload.ctaLink);
  }
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
  if (!partial || payload.sortOrder != null || payload.order != null) {
    updates.sortOrder = Number(payload.sortOrder ?? payload.order) || 0;
  }

  return updates;
}

function assertImageRequired(position, imageUrl) {
  if (!imageRequiredForPosition(position)) return;
  if (!clean(imageUrl)) throw new Error('imageUrl is required for this position.');
}

function assertImageRequiredForBanner(page, position, imageUrl, sortOrder) {
  const pg = clean(page).toLowerCase() || 'home';
  const pos = clean(position).toLowerCase();
  const order = Number(sortOrder) || 0;
  if (isBgtCommonPage(pg) && isBlaunkAdvantagePosition(pos)) {
    if (order > 0 && !clean(imageUrl)) {
      throw new Error('imageUrl is required for advantage cards.');
    }
    return;
  }
  if (isBgtCommonPage(pg) && !bgtImageRequiredForPosition(pos)) return;
  if (isBoutiquePage(pg)) {
    if (isBoutiqueHeaderCardPosition(pos)) {
      if (order > 0 && !clean(imageUrl)) {
        throw new Error(`imageUrl is required for ${pos} carousel cards.`);
      }
      return;
    }
    if (pos === 'hero' && !clean(imageUrl)) {
      throw new Error('imageUrl is required for boutique hero.');
    }
    if (isBoutiqueImageSlidePosition(pos) && !clean(imageUrl)) {
      throw new Error(`imageUrl is required for ${pos} slides.`);
    }
    return;
  }
  assertImageRequired(pos, imageUrl);
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
  let p = clean(page).toLowerCase() || 'home';
  if (p === 'bgt-trading') p = 'bgt-common';
  const query = { page: p };
  const pos = clean(position).toLowerCase();
  if (pos) query.position = pos;
  const sort = pos ? { sortOrder: 1 } : { position: 1, sortOrder: 1 };
  const rows = await Banner.find(query).sort(sort).lean();
  const records = rows.filter(isActiveNow).map(toPublicDto);
  return { records };
}

async function createBanner(payload) {
  const data = buildPayload(payload);
  const page = data.page || 'home';
  const position = data.position || assertPositionForPage(payload.position || 'hero', page);
  data.position = position;
  assertImageRequiredForBanner(page, position, data.imageUrl, data.sortOrder);
  const existing = await Banner.countDocuments({ page, position });
  const maxRecords = resolveMaxRecords(page, position);
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
  const updates = buildPayload(payload, {
    partial: true,
    existingPosition: existing.position,
    existingPage: existing.page,
  });
  const position = updates.position || existing.position;
  const nextSort = updates.sortOrder !== undefined ? updates.sortOrder : existing.sortOrder;
  const nextUrl = updates.imageUrl !== undefined ? updates.imageUrl : existing.imageUrl;
  const needsImageCheck =
    payload.imageUrl !== undefined
    || updates.sortOrder !== undefined
    || (isBgtCommonPage(existing.page)
      ? (bgtImageRequiredForPosition(position) || isBlaunkAdvantagePosition(position))
      : isBoutiquePage(existing.page)
        ? (position === 'hero'
          || isBoutiqueImageSlidePosition(position)
          || isBoutiqueHeaderCardPosition(position))
        : imageRequiredForPosition(position));
  if (needsImageCheck) {
    assertImageRequiredForBanner(existing.page, position, nextUrl, nextSort);
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

async function ensureBgtCommonHeroBanners() {
  await Banner.updateMany({ page: 'bgt-trading' }, { $set: { page: 'bgt-common' } });

  const count = await Banner.countDocuments({ page: 'bgt-common', position: 'hero' });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'bgt-common',
      position: 'hero',
      title: 'Global Trade Protocol 2.0',
      subtitle: 'Streamlined cross-border trade with verified compliance workflows.',
      ctaText: 'Learn More',
      linkUrl: '/bgt/trade-protocol',
      imageUrl: '/uploads/bgt-hero-trade-protocol.jpg',
      focalPoint: { x: 55, y: 42 },
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'bgt-common',
      position: 'hero',
      title: 'Zero Commission Marketplace',
      subtitle: 'Connect directly with buyers and sellers — no platform fees.',
      ctaText: 'Start Trading',
      linkUrl: '/bgt/marketplace',
      imageUrl: '/uploads/bgt-hero-zero-commission.jpg',
      focalPoint: { x: 50, y: 45 },
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'bgt-common',
      position: 'hero',
      title: 'Gateway to Trusted Suppliers',
      subtitle: 'Source from vetted manufacturers across global markets.',
      ctaText: 'Find Suppliers',
      linkUrl: '/bgt/suppliers',
      imageUrl: '/uploads/bgt-hero-suppliers.jpg',
      focalPoint: { x: 48, y: 40 },
      isActive: true,
      sortOrder: 3,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtDiscoveryHubBanners() {
  const sets = [
    {
      position: 'discovery-best-sellers',
      records: [
        { sortOrder: 0, tag: 'Discovery', title: 'BEST SELLERS', subtitle: 'NEAR YOU' },
        { sortOrder: 1, tag: '💎', title: 'Boutique', linkUrl: '/section/BGT Trading' },
        { sortOrder: 2, tag: '⚡', title: 'Electronics', linkUrl: '/section/BGT Trading' },
        { sortOrder: 3, tag: '🌱', title: 'Agro', linkUrl: '/section/BGT Trading' },
        { sortOrder: 4, tag: '✨', title: 'Hotel', linkUrl: '/section/BGT Trading' },
      ],
    },
    {
      position: 'discovery-top-category',
      records: [
        { sortOrder: 0, tag: 'Platform Trends', title: 'TOP CATEGORY', subtitle: 'SEARCH' },
        { sortOrder: 1, tag: '🔧', title: 'Plumbers', linkUrl: '/section/Dial' },
        { sortOrder: 2, tag: '🏠', title: 'Houses', linkUrl: '/section/Dial' },
        { sortOrder: 3, tag: '🚚', title: 'Transport', linkUrl: '/section/Dial' },
        { sortOrder: 4, tag: '⚙️', title: 'Mechanic', linkUrl: '/section/Dial' },
      ],
    },
  ];

  let seeded = 0;
  for (const set of sets) {
    const count = await Banner.countDocuments({ page: 'bgt-common', position: set.position });
    if (count > 0) continue;
    const samples = set.records.map((row) => ({
      page: 'bgt-common',
      position: set.position,
      tag: row.tag || '',
      title: row.title || '',
      subtitle: row.subtitle || '',
      linkUrl: row.linkUrl || '',
      imageUrl: '',
      isActive: true,
      sortOrder: row.sortOrder,
    }));
    await Banner.insertMany(samples);
    seeded += samples.length;
  }
  return { seeded };
}

async function ensureBgtExploreGalleryBanners() {
  const count = await Banner.countDocuments({ page: 'bgt-common', position: 'explore-gallery' });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'bgt-common',
      position: 'explore-gallery',
      title: 'Elite Resort',
      imageUrl: '/uploads/bgt-explore-elite-resort.jpg',
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'bgt-common',
      position: 'explore-gallery',
      title: 'Ocean View Marketplace',
      imageUrl: '/uploads/bgt-explore-ocean-marketplace.jpg',
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'bgt-common',
      position: 'explore-gallery',
      title: 'Alpine Lodge',
      imageUrl: '/uploads/bgt-explore-alpine-lodge.jpg',
      isActive: true,
      sortOrder: 3,
    },
    {
      page: 'bgt-common',
      position: 'explore-gallery',
      title: 'City Plaza Gallery',
      imageUrl: '/uploads/bgt-explore-city-plaza.jpg',
      isActive: true,
      sortOrder: 4,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtExplorerCarouselBanners() {
  const count = await Banner.countDocuments({ page: 'bgt-common', position: 'explorer-carousel' });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'bgt-common',
      position: 'explorer-carousel',
      title: 'Global Marketplace Explorer',
      imageUrl: '/uploads/bgt-explorer-carousel-1.jpg',
      focalPoint: { x: 50, y: 45 },
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'bgt-common',
      position: 'explorer-carousel',
      title: 'Trusted Trade Routes',
      imageUrl: '/uploads/bgt-explorer-carousel-2.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'bgt-common',
      position: 'explorer-carousel',
      title: 'Premium Supplier Network',
      imageUrl: '/uploads/bgt-explorer-carousel-3.jpg',
      focalPoint: { x: 48, y: 42 },
      isActive: true,
      sortOrder: 3,
    },
    {
      page: 'bgt-common',
      position: 'explorer-carousel',
      title: 'Cross-Border Commerce Hub',
      imageUrl: '/uploads/bgt-explorer-carousel-4.jpg',
      focalPoint: { x: 52, y: 48 },
      isActive: true,
      sortOrder: 4,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtInternationalSourcingBanners() {
  const count = await Banner.countDocuments({
    page: 'bgt-common',
    position: 'international-sourcing-banner',
  });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'bgt-common',
      position: 'international-sourcing-banner',
      title: 'Global Trade Corridor',
      imageUrl: '/uploads/bgt-intl-sourcing-banner-1.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'bgt-common',
      position: 'international-sourcing-banner',
      title: 'Logistics Network Hub',
      imageUrl: '/uploads/bgt-intl-sourcing-banner-2.jpg',
      focalPoint: { x: 50, y: 45 },
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'bgt-common',
      position: 'international-sourcing-banner',
      title: 'Trade Banner',
      imageUrl: '/uploads/bgt-intl-sourcing-banner-3.jpg',
      focalPoint: { x: 48, y: 50 },
      isActive: true,
      sortOrder: 3,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtViewMoreHeroBanners() {
  const count = await Banner.countDocuments({ page: 'bgt-common', position: 'view-more-hero' });
  if (count > 0) return { seeded: 0 };

  const samples = [1, 2, 3].map((n) => ({
    page: 'bgt-common',
    position: 'view-more-hero',
    title: `Banner ${n}`,
    imageUrl: `/uploads/bgt-view-more-hero-${n}.jpg`,
    focalPoint: { x: 50, y: 50 },
    isActive: true,
    sortOrder: n,
  }));

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtViewMoreSponsoredAdsBanners() {
  const count = await Banner.countDocuments({
    page: 'bgt-common',
    position: 'view-more-sponsored-ads',
  });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'bgt-common',
      position: 'view-more-sponsored-ads',
      title: 'Global Exports Premium Quality',
      linkUrl: '/section/BGT Trading',
      imageUrl: '/uploads/bgt-view-more-sponsored-1.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'bgt-common',
      position: 'view-more-sponsored-ads',
      title: 'International Trade Gateway',
      linkUrl: '/section/BGT Trading',
      imageUrl: '/uploads/bgt-view-more-sponsored-2.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'bgt-common',
      position: 'view-more-sponsored-ads',
      title: 'Verified Indian Suppliers',
      linkUrl: '/section/BGT Trading',
      imageUrl: '/uploads/bgt-view-more-sponsored-3.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 3,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtViewMorePremiumShowcaseBanners() {
  const count = await Banner.countDocuments({
    page: 'bgt-common',
    position: 'view-more-premium-showcase',
  });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'bgt-common',
      position: 'view-more-premium-showcase',
      title: 'Premium Apparel Showcase',
      linkUrl: '/section/BGT Trading/Apparel',
      imageUrl: '/uploads/bgt-view-more-premium-1.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'bgt-common',
      position: 'view-more-premium-showcase',
      title: 'Premium Electronics Showcase',
      linkUrl: '/section/BGT Trading/Electronics',
      imageUrl: '/uploads/bgt-view-more-premium-2.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'bgt-common',
      position: 'view-more-premium-showcase',
      title: 'Premium Agro Trade Showcase',
      linkUrl: '/section/BGT Trading/Agro',
      imageUrl: '/uploads/bgt-view-more-premium-3.jpg',
      focalPoint: { x: 50, y: 50 },
      isActive: true,
      sortOrder: 3,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtViewMoreTrendingDiscoveryBanners() {
  const count = await Banner.countDocuments({
    page: 'bgt-common',
    position: 'view-more-trending-discovery',
  });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'bgt-common',
      position: 'view-more-trending-discovery',
      title: 'Ethnic Wear Selection',
      linkUrl: '/section/BGT Trading/Apparel',
      imageUrl: '/uploads/bgt-view-more-trending-1.jpg',
      isActive: true,
      sortOrder: 1,
    },
    {
      page: 'bgt-common',
      position: 'view-more-trending-discovery',
      title: 'Electronics Discovery',
      linkUrl: '/section/BGT Trading/Electronics',
      imageUrl: '/uploads/bgt-view-more-trending-2.jpg',
      isActive: true,
      sortOrder: 2,
    },
    {
      page: 'bgt-common',
      position: 'view-more-trending-discovery',
      title: 'Agro Collections',
      linkUrl: '/section/BGT Trading/Agro',
      imageUrl: '/uploads/bgt-view-more-trending-3.jpg',
      isActive: true,
      sortOrder: 3,
    },
    {
      page: 'bgt-common',
      position: 'view-more-trending-discovery',
      title: 'Boutique Trends',
      linkUrl: '/section/BGT Trading/Boutique',
      imageUrl: '/uploads/bgt-view-more-trending-4.jpg',
      isActive: true,
      sortOrder: 4,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtViewMoreDealsOffersBanner() {
  const count = await Banner.countDocuments({
    page: 'bgt-common',
    position: 'view-more-deals-offers',
  });
  if (count > 0) return { seeded: 0 };

  await Banner.create({
    page: 'bgt-common',
    position: 'view-more-deals-offers',
    title: 'AMAZING',
    titleAccent: 'DEALS',
    subtitle: 'Best offers from verified vendors',
    ctaText: 'Explore Now',
    linkUrl: '/section/BGT Trading',
    imageUrl: '/uploads/bgt-view-more-deals-offers.jpg',
    focalPoint: { x: 50, y: 50 },
    isActive: true,
    sortOrder: 1,
  });
  return { seeded: 1 };
}

async function ensureBgtViewMoreBrandFooterBanner() {
  const count = await Banner.countDocuments({
    page: 'bgt-common',
    position: 'view-more-brand-footer',
  });
  if (count > 0) return { seeded: 0 };

  await Banner.create({
    page: 'bgt-common',
    position: 'view-more-brand-footer',
    title: 'THE BEST INDIAN',
    titleAccent: 'BUSINESS SEARCH PORTAL',
    subtitle: 'Trusted by crores of Indians',
    tag: 'Generates',
    description: 'Business Leads',
    imageUrl: '/uploads/bgt-view-more-brand-footer.jpg',
    isActive: true,
    sortOrder: 1,
  });
  return { seeded: 1 };
}

async function ensureBoutiqueHeroBanners() {
  const count = await Banner.countDocuments({ page: 'boutique', position: 'hero' });
  if (count > 0) return { seeded: 0 };

  const samples = [0, 1, 2].map((sortOrder) => ({
    page: 'boutique',
    position: 'hero',
    title: `Boutique Hero ${sortOrder + 1}`,
    imageUrl: `/uploads/boutique-hero-${sortOrder + 1}.jpg`,
    focalPoint: { x: 50, y: 50 },
    isActive: true,
    sortOrder,
  }));

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBoutiqueFashionAccessoriesBanners() {
  const count = await Banner.countDocuments({ page: 'boutique', position: 'fashion-accessories' });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'boutique',
      position: 'fashion-accessories',
      title: 'Fashion',
      titleAccent: 'Accessories',
      ctaText: 'SEE ALL CATEGORIES',
      linkUrl: '/boutique/categories',
      isActive: true,
      sortOrder: 0,
    },
    ...[1, 2, 3].map((sortOrder) => ({
      page: 'boutique',
      position: 'fashion-accessories',
      title: `Fashion Accessories ${sortOrder}`,
      imageUrl: `/uploads/boutique-fashion-accessories-${sortOrder}.jpg`,
      isActive: true,
      sortOrder,
    })),
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBoutiqueTrendyStarBanners() {
  const count = await Banner.countDocuments({ page: 'boutique', position: 'trendy-star' });
  if (count > 0) return { seeded: 0 };

  const cardTitles = ['STREET WEAR', 'URBAN STYLE', 'YOUTH COLLECTIVE'];
  const samples = [
    {
      page: 'boutique',
      position: 'trendy-star',
      title: 'TRENDY',
      titleAccent: 'STAR',
      isActive: true,
      sortOrder: 0,
    },
    ...cardTitles.map((title, index) => ({
      page: 'boutique',
      position: 'trendy-star',
      title,
      imageUrl: `/uploads/boutique-trendy-star-${index + 1}.jpg`,
      isActive: true,
      sortOrder: index + 1,
    })),
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBoutiqueEditorialGalleryBanners() {
  const count = await Banner.countDocuments({ page: 'boutique', position: 'editorial-gallery' });
  if (count > 0) return { seeded: 0 };

  const samples = [0, 1].map((sortOrder) => ({
    page: 'boutique',
    position: 'editorial-gallery',
    title: `Editorial Gallery ${sortOrder + 1}`,
    imageUrl: `/uploads/boutique-editorial-gallery-${sortOrder + 1}.jpg`,
    isActive: true,
    sortOrder,
  }));

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBoutiqueNewLaunchCarouselBanners() {
  const count = await Banner.countDocuments({ page: 'boutique', position: 'new-launch-carousel' });
  if (count > 0) return { seeded: 0 };

  const samples = [0, 1, 2].map((sortOrder) => ({
    page: 'boutique',
    position: 'new-launch-carousel',
    title: `New Launch ${sortOrder + 1}`,
    imageUrl: `/uploads/boutique-new-launch-${sortOrder + 1}.jpg`,
    isActive: true,
    sortOrder,
  }));

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBoutiqueExclusiveVideoBanners() {
  const count = await Banner.countDocuments({ page: 'boutique', position: 'exclusive-video' });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'boutique',
      position: 'exclusive-video',
      title: 'EX',
      titleAccent: 'CLUSIVE',
      isActive: true,
      sortOrder: 0,
    },
    {
      page: 'boutique',
      position: 'exclusive-video',
      imageUrl: '/uploads/boutique-exclusive-video.jpg',
      subtitle: 'COLLEZIONE PRIVATA',
      title: 'ROSA GRAND MILANO',
      tag: 'CD',
      titleAccent: 'GIFF VIDEO',
      description: 'WATCH ON YOUTUBE',
      ctaText: 'PLAY',
      linkUrl: 'https://www.youtube.com/watch?v=example',
      isActive: true,
      sortOrder: 1,
    },
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBoutiqueDisclaimerUtilityBanners() {
  const count = await Banner.countDocuments({ page: 'boutique', position: 'disclaimer-utility' });
  if (count > 0) return { seeded: 0 };

  const samples = [
    {
      page: 'boutique',
      position: 'disclaimer-utility',
      title: 'LEGAL',
      titleAccent: 'DISCLAIMER',
      description: 'Important information regarding product listings, pricing, and seller policies.',
      isActive: true,
      sortOrder: 0,
    },
    ...[1, 2, 3].map((sortOrder) => ({
      page: 'boutique',
      position: 'disclaimer-utility',
      title: `Disclaimer Card ${sortOrder}`,
      imageUrl: `/uploads/boutique-disclaimer-utility-${sortOrder}.jpg`,
      isActive: true,
      sortOrder,
    })),
  ];

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtViewMoreSidebarAdsBanners() {
  const count = await Banner.countDocuments({
    page: 'bgt-common',
    position: 'view-more-sidebar-ads',
  });
  if (count > 0) return { seeded: 0 };

  const samples = Array.from({ length: 9 }, (_, i) => ({
    page: 'bgt-common',
    position: 'view-more-sidebar-ads',
    title: `Sidebar Ad ${i + 1}`,
    imageUrl: `/uploads/bgt-view-more-sidebar-${i + 1}.jpg`,
    linkUrl: i === 0 ? '/section/BGT Trading' : '',
    isActive: true,
    sortOrder: i,
  }));

  await Banner.insertMany(samples);
  return { seeded: samples.length };
}

async function ensureBgtBlaunkAdvantageBanners() {
  const count = await Banner.countDocuments({ page: 'bgt-common', position: 'blaunk-advantage' });
  if (count > 0) return { seeded: 0 };

  const cardTitles = [
    'GST TAX COMPLIANCE',
    'B2B DEALS',
    'SAVE TIME',
    'GLOBAL NETWORK',
    'BULK OFFERS',
    '100% QUALITY',
  ];

  const samples = [
    {
      page: 'bgt-common',
      position: 'blaunk-advantage',
      description:
        "is an International Gateway Built on India's Most Trusted B2B Platform, Connecting 300,000+ Verified Indian Suppliers.",
      imageUrl: '',
      isActive: true,
      sortOrder: 0,
    },
    ...cardTitles.map((title, index) => ({
      page: 'bgt-common',
      position: 'blaunk-advantage',
      title,
      imageUrl: `/uploads/bgt-advantage-${index + 1}.jpg`,
      isActive: true,
      sortOrder: index + 1,
    })),
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
  ensureBgtCommonHeroBanners,
  ensureBgtDiscoveryHubBanners,
  ensureBgtExploreGalleryBanners,
  ensureBgtExplorerCarouselBanners,
  ensureBgtInternationalSourcingBanners,
  ensureBgtViewMoreHeroBanners,
  ensureBgtViewMoreSponsoredAdsBanners,
  ensureBgtViewMorePremiumShowcaseBanners,
  ensureBgtViewMoreTrendingDiscoveryBanners,
  ensureBgtViewMoreDealsOffersBanner,
  ensureBgtViewMoreBrandFooterBanner,
  ensureBgtViewMoreSidebarAdsBanners,
  ensureBoutiqueHeroBanners,
  ensureBoutiqueFashionAccessoriesBanners,
  ensureBoutiqueTrendyStarBanners,
  ensureBoutiqueEditorialGalleryBanners,
  ensureBoutiqueNewLaunchCarouselBanners,
  ensureBoutiqueExclusiveVideoBanners,
  ensureBoutiqueDisclaimerUtilityBanners,
  ensureBgtBlaunkAdvantageBanners,
  HOMEPAGE_BANNER_POSITIONS,
};
