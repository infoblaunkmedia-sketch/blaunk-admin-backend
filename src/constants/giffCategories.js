/** CMS GIFF categories — slug, label, max uploads per category. */
const GIFF_CATEGORIES = [
  { id: 'home-page-cake-giff', label: 'HOME PAGE CAKE - GIFF', maxRecords: 2 },
  { id: 'connect-page-giff', label: 'CONNECT PAGE - GIFF', maxRecords: 2 },
  { id: 'boutique-page-giff', label: 'BOUTIQUE PAGE - GIFF', maxRecords: 1 },
  { id: 'bgt-home-page-giff', label: 'BGT HOME PAGE - GIFF', maxRecords: 1 },
  { id: 'dial-home-page-hotel-giff', label: 'DIAL HOME PAGE - HOTEL GIFF', maxRecords: 2 },
  { id: 'dial-home-page-boutique', label: 'DIAL HOME PAGE - BOUTIQUE', maxRecords: 1 },
  { id: 'hotel-home-page-giff', label: 'HOTEL HOME PAGE - GIFF', maxRecords: 1 },
  { id: 'hotel-page-wedding-giff', label: 'HOTEL PAGE WEDDING - GIFF', maxRecords: 1 },
];

const GIFF_CATEGORY_IDS = new Set(GIFF_CATEGORIES.map((c) => c.id));

const GIFF_FORMATS = new Set(['gif', 'jpg', 'jpeg']);

function getGiffCategory(id) {
  const key = String(id || '').trim().toLowerCase();
  return GIFF_CATEGORIES.find((c) => c.id === key) || null;
}

function maxRecordsForCategory(category) {
  return getGiffCategory(category)?.maxRecords ?? null;
}

function assertGiffCategory(category) {
  const cat = getGiffCategory(category);
  if (!cat) {
    throw new Error(`category must be one of: ${[...GIFF_CATEGORY_IDS].join(', ')}`);
  }
  return cat.id;
}

module.exports = {
  GIFF_CATEGORIES,
  GIFF_CATEGORY_IDS,
  GIFF_FORMATS,
  getGiffCategory,
  maxRecordsForCategory,
  assertGiffCategory,
};
