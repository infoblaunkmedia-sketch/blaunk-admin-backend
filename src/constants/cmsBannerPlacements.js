/** CMS Upload placements — keep in sync with admin frontend banner configs. */

const { GIFF_CATEGORIES } = require('./giffCategories');

const DEFAULT_MAX_SLOTS = 8;

const CMS_PAGES = [
  { id: 'home', label: 'Homepage' },
  { id: 'bgt', label: 'BGT' },
  { id: 'bgt-view-more', label: 'BGT View More' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'giff', label: 'GIFF' },
];

const GIFF_SLOTS = GIFF_CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  maxRecords: c.maxRecords,
}));

const HOME_SLOTS = [
  { id: 'hero', label: 'Hero carousel' },
  { id: 'market-map', label: 'Market map (BGT)', maxRecords: 1 },
  { id: 'market-card', label: 'Market cards' },
  { id: 'industry-card', label: 'Industry insights' },
  { id: 'bdial-feature', label: 'B-Dial feature', maxRecords: 1 },
  { id: 'bdial-service', label: 'B-Dial services' },
  { id: 'bdial-logistics', label: 'B-Dial logistics' },
  { id: 'bdial-helpdesk', label: 'B-Dial helpdesk' },
  { id: 'trade-hub', label: 'Connect slider' },
  { id: 'connect-testimonials', label: 'Mini slider' },
  { id: 'partner-spotlight', label: 'Partner spotlight' },
  { id: 'sustainability', label: 'Ethical & Green', maxRecords: 1 },
  { id: 'valued-clients', label: 'Valued clients' },
];

const BGT_SLOTS = [
  { id: 'hero', label: 'Hero', maxRecords: 3 },
  { id: 'discovery-best-sellers', label: 'Discovery best sellers', maxRecords: 7 },
  { id: 'discovery-top-category', label: 'Discovery top category', maxRecords: 7 },
  { id: 'explore-gallery', label: 'Explore gallery', maxRecords: 4 },
  { id: 'explorer-carousel', label: 'Explorer carousel', maxRecords: 4 },
  { id: 'international-sourcing-banner', label: 'International sourcing', maxRecords: 3 },
  { id: 'blaunk-advantage', label: 'Blaunk advantage', maxRecords: 7 },
];

const BGT_VIEW_MORE_SLOTS = [
  { id: 'view-more-hero', label: 'View More Hero', maxRecords: 3 },
  { id: 'view-more-sponsored-ads', label: 'Sponsored ads', maxRecords: 3 },
  { id: 'view-more-premium-showcase', label: 'Premium showcase', maxRecords: 3 },
  { id: 'view-more-trending-discovery', label: 'Trending discovery', maxRecords: 5 },
  { id: 'view-more-deals-offers', label: 'Deals & offers', maxRecords: 1 },
  { id: 'view-more-brand-footer', label: 'Brand footer', maxRecords: 1 },
  { id: 'view-more-sidebar-ads', label: 'Sidebar ads', maxRecords: 9 },
];

const BOUTIQUE_SLOTS = [
  { id: 'hero', label: 'Hero', maxRecords: 5 },
  { id: 'fashion-accessories', label: 'Fashion accessories', maxRecords: 9 },
  { id: 'trendy-star', label: 'Trendy star', maxRecords: 9 },
  { id: 'editorial-gallery', label: 'Editorial gallery', maxRecords: 12 },
  { id: 'new-launch-carousel', label: 'New launch carousel', maxRecords: 2 },
  { id: 'exclusive-video', label: 'Exclusive video', maxRecords: 2 },
  { id: 'disclaimer-utility', label: 'Disclaimer utility', maxRecords: 4 },
];

const SLOTS_BY_PAGE = {
  home: HOME_SLOTS,
  bgt: BGT_SLOTS,
  'bgt-view-more': BGT_VIEW_MORE_SLOTS,
  boutique: BOUTIQUE_SLOTS,
  giff: GIFF_SLOTS,
};

const DEFAULT_SLOT_BY_PAGE = {
  home: 'hero',
  bgt: 'hero',
  'bgt-view-more': 'view-more-hero',
  boutique: 'hero',
  giff: 'home-page-cake-giff',
};

/** Legacy DSA section → CMS placement */
const LEGACY_SECTION_MAP = {
  HOMEPAGE: { cmsPage: 'home', cmsPosition: 'hero' },
  BGT: { cmsPage: 'bgt', cmsPosition: 'hero' },
  BOUTIQUE: { cmsPage: 'boutique', cmsPosition: 'hero' },
  TOUR: { cmsPage: 'home', cmsPosition: 'trade-hub' },
  STORE: { cmsPage: 'home', cmsPosition: 'partner-spotlight' },
  CAKE: { cmsPage: 'boutique', cmsPosition: 'new-launch-carousel' },
  LOGISTIC: { cmsPage: 'bgt', cmsPosition: 'blaunk-advantage' },
};

function clean(v) {
  return String(v == null ? '' : v).trim();
}

function slotsForPage(page) {
  return SLOTS_BY_PAGE[clean(page)] || [];
}

function findSlot(page, position) {
  const pos = clean(position);
  return slotsForPage(page).find((s) => s.id === pos) || null;
}

function isValidPlacement(page, position) {
  if (clean(position) === 'testimonials') return false;
  return !!findSlot(page, position);
}

function maxSlotsForPlacement(page, position) {
  const pg = clean(page);
  if (pg === 'giff') {
    const cat = GIFF_CATEGORIES.find((c) => c.id === clean(position));
    if (cat) return cat.maxRecords;
    return DEFAULT_MAX_SLOTS;
  }
  const slot = findSlot(page, position);
  if (!slot) return DEFAULT_MAX_SLOTS;
  const max = Number(slot.maxRecords);
  return Number.isFinite(max) && max >= 1 ? max : DEFAULT_MAX_SLOTS;
}

function defaultSlotForPage(page) {
  return DEFAULT_SLOT_BY_PAGE[clean(page)] || 'hero';
}

function pageLabel(page) {
  return CMS_PAGES.find((p) => p.id === clean(page))?.label || clean(page);
}

function slotLabel(page, position) {
  return findSlot(page, position)?.label || clean(position);
}

function migrateLegacySection(section) {
  const key = clean(section).toUpperCase();
  if (LEGACY_SECTION_MAP[key]) return { ...LEGACY_SECTION_MAP[key] };
  const raw = clean(section);
  if (raw.includes(':')) {
    const [cmsPage, ...rest] = raw.split(':');
    const cmsPosition = rest.join(':');
    if (isValidPlacement(cmsPage, cmsPosition)) {
      return { cmsPage: clean(cmsPage), cmsPosition: clean(cmsPosition) };
    }
  }
  return null;
}

function resolvePlacement(input = {}) {
  let cmsPage = clean(input.cmsPage);
  let cmsPosition = clean(input.cmsPosition);
  if (cmsPage && cmsPosition && isValidPlacement(cmsPage, cmsPosition)) {
    return { cmsPage, cmsPosition };
  }
  const legacy = migrateLegacySection(input.section);
  if (legacy) return legacy;
  if (cmsPage && !cmsPosition) {
    cmsPosition = defaultSlotForPage(cmsPage);
    if (isValidPlacement(cmsPage, cmsPosition)) return { cmsPage, cmsPosition };
  }
  return null;
}

function legacySectionFromPlacement(cmsPage, cmsPosition) {
  const entry = Object.entries(LEGACY_SECTION_MAP).find(
    ([, v]) => v.cmsPage === cmsPage && v.cmsPosition === cmsPosition,
  );
  if (entry) return entry[0];
  return `${cmsPage}:${cmsPosition}`;
}

/** All legacy section codes that map to this CMS placement (for DB queries). */
function legacySectionKeysForPlacement(cmsPage, cmsPosition) {
  const keys = Object.entries(LEGACY_SECTION_MAP)
    .filter(([, v]) => v.cmsPage === cmsPage && v.cmsPosition === cmsPosition)
    .map(([k]) => k);
  const composite = legacySectionFromPlacement(cmsPage, cmsPosition);
  if (!keys.includes(composite)) keys.push(composite);
  return keys;
}

function placementQueryOr(placement) {
  const legacyKeys = legacySectionKeysForPlacement(placement.cmsPage, placement.cmsPosition);
  return {
    $or: [
      { cmsPage: placement.cmsPage, cmsPosition: placement.cmsPosition },
      { section: { $in: legacyKeys } },
    ],
  };
}

module.exports = {
  CMS_PAGES,
  SLOTS_BY_PAGE,
  DEFAULT_MAX_SLOTS,
  slotsForPage,
  isValidPlacement,
  maxSlotsForPlacement,
  defaultSlotForPage,
  pageLabel,
  slotLabel,
  migrateLegacySection,
  resolvePlacement,
  legacySectionFromPlacement,
  legacySectionKeysForPlacement,
  placementQueryOr,
};
