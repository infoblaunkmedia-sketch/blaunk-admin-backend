/** BGT Common / BGT Trading page banner slots — extend as new CMS sections are added. */
const BGT_COMMON_BANNER_POSITIONS = [
  'hero',
  'discovery-best-sellers',
  'discovery-top-category',
  'explore-gallery',
  'explorer-carousel',
  'international-sourcing-banner',
  'blaunk-advantage',
  'view-more-hero',
  'view-more-sponsored-ads',
  'view-more-premium-showcase',
  'view-more-trending-discovery',
  'view-more-deals-offers',
  'view-more-brand-footer',
  'view-more-sidebar-ads',
];

/** Max records per position on BGT Common (null = unlimited). */
const BGT_COMMON_MAX_RECORDS = {
  hero: 3,
  'discovery-best-sellers': 5,
  'discovery-top-category': 5,
  'explore-gallery': 4,
  'explorer-carousel': 4,
  'international-sourcing-banner': 3,
  'blaunk-advantage': 7,
  'view-more-hero': 3,
  'view-more-sponsored-ads': 3,
  'view-more-premium-showcase': 3,
  'view-more-trending-discovery': 5,
  'view-more-deals-offers': 1,
  'view-more-brand-footer': 1,
  'view-more-sidebar-ads': 9,
};

const BGT_DISCOVERY_POSITIONS = new Set([
  'discovery-best-sellers',
  'discovery-top-category',
]);

const BGT_ADVANTAGE_POSITIONS = new Set(['blaunk-advantage']);

const BGT_POSITIONS_WITHOUT_IMAGE = new Set([
  'discovery-best-sellers',
  'discovery-top-category',
  'blaunk-advantage',
]);

function isBgtCommonPage(page) {
  const p = String(page || '').trim().toLowerCase();
  return p === 'bgt-common' || p === 'bgt-trading';
}

function isDiscoveryPosition(position) {
  return BGT_DISCOVERY_POSITIONS.has(String(position || '').trim().toLowerCase());
}

function isBlaunkAdvantagePosition(position) {
  return BGT_ADVANTAGE_POSITIONS.has(String(position || '').trim().toLowerCase());
}

function bgtMaxRecordsForPosition(position) {
  const pos = String(position || '').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(BGT_COMMON_MAX_RECORDS, pos)) {
    return BGT_COMMON_MAX_RECORDS[pos];
  }
  return null;
}

function bgtImageRequiredForPosition(position) {
  return !BGT_POSITIONS_WITHOUT_IMAGE.has(String(position || '').trim().toLowerCase());
}

module.exports = {
  BGT_COMMON_BANNER_POSITIONS,
  BGT_COMMON_MAX_RECORDS,
  BGT_DISCOVERY_POSITIONS,
  BGT_ADVANTAGE_POSITIONS,
  BGT_POSITIONS_WITHOUT_IMAGE,
  isBgtCommonPage,
  isDiscoveryPosition,
  isBlaunkAdvantagePosition,
  bgtMaxRecordsForPosition,
  bgtImageRequiredForPosition,
};
