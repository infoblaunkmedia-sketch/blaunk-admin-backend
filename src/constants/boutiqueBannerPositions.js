/** Boutique page banner slots. */
const BOUTIQUE_BANNER_POSITIONS = ['hero', 'fashion-accessories', 'trendy-star', 'editorial-gallery', 'new-launch-carousel', 'exclusive-video', 'disclaimer-utility'];

const BOUTIQUE_FASHION_ACCESSORIES_CHIP_COUNT = 5;
const BOUTIQUE_TRENDY_STAR_CHIP_COUNT = 5;
const BOUTIQUE_DISCLAIMER_UTILITY_CHIP_COUNT = 9;
const BOUTIQUE_EDITORIAL_GALLERY_MAX = 8;

const BOUTIQUE_HEADER_CARD_POSITIONS = new Set(['fashion-accessories', 'trendy-star', 'exclusive-video', 'disclaimer-utility']);

const BOUTIQUE_MAX_RECORDS = {
  hero: 5,
  'fashion-accessories': 1 + BOUTIQUE_FASHION_ACCESSORIES_CHIP_COUNT,
  'trendy-star': 1 + BOUTIQUE_TRENDY_STAR_CHIP_COUNT,
  'editorial-gallery': BOUTIQUE_EDITORIAL_GALLERY_MAX,
  'exclusive-video': 2,
  'disclaimer-utility': 1 + BOUTIQUE_DISCLAIMER_UTILITY_CHIP_COUNT,
};

function isBoutiqueFashionAccessoriesPosition(position) {
  return String(position || '').trim().toLowerCase() === 'fashion-accessories';
}

function isBoutiqueTrendyStarPosition(position) {
  return String(position || '').trim().toLowerCase() === 'trendy-star';
}

function isBoutiqueHeaderCardPosition(position) {
  return BOUTIQUE_HEADER_CARD_POSITIONS.has(String(position || '').trim().toLowerCase());
}

function isBoutiqueImageSlidePosition(position) {
  const pos = String(position || '').trim().toLowerCase();
  return pos === 'editorial-gallery' || pos === 'new-launch-carousel';
}

function isBoutiquePage(page) {
  const p = String(page || '').trim().toLowerCase();
  return p === 'boutique';
}

function boutiqueMaxRecordsForPosition(position) {
  const pos = String(position || '').toLowerCase();
  if (Object.prototype.hasOwnProperty.call(BOUTIQUE_MAX_RECORDS, pos)) {
    return BOUTIQUE_MAX_RECORDS[pos];
  }
  return null;
}

function assertBoutiquePosition(position) {
  const pos = String(position || '').trim().toLowerCase();
  if (!BOUTIQUE_BANNER_POSITIONS.includes(pos)) {
    throw new Error(`position must be one of: ${BOUTIQUE_BANNER_POSITIONS.join(', ')}`);
  }
  return pos;
}

module.exports = {
  BOUTIQUE_BANNER_POSITIONS,
  BOUTIQUE_FASHION_ACCESSORIES_CHIP_COUNT,
  BOUTIQUE_TRENDY_STAR_CHIP_COUNT,
  BOUTIQUE_DISCLAIMER_UTILITY_CHIP_COUNT,
  BOUTIQUE_EDITORIAL_GALLERY_MAX,
  BOUTIQUE_MAX_RECORDS,
  isBoutiquePage,
  isBoutiqueFashionAccessoriesPosition,
  isBoutiqueTrendyStarPosition,
  isBoutiqueHeaderCardPosition,
  isBoutiqueImageSlidePosition,
  boutiqueMaxRecordsForPosition,
  assertBoutiquePosition,
};
