/** Homepage banner slots — must match marketing Frontend contract. */
const HOMEPAGE_BANNER_POSITIONS = [
  'hero',
  'market-map',
  'market-card',
  'industry-card',
  'bdial-feature',
  'bdial-service',
  'bdial-logistics',
  'bdial-helpdesk',
  'trade-hub',
  'connect-testimonials',
  'partner-spotlight',
  'sustainability',
  'valued-clients',
];

const POSITIONS_WITHOUT_IMAGE = new Set(['bdial-helpdesk']);
const POSITIONS_OPTIONAL_IMAGE = new Set(['cake-upload']);

/** Only one banner document per page+position. */
const SINGLE_RECORD_POSITIONS = new Set(['market-map', 'bdial-feature', 'sustainability']);

const CAKE_IMAGE_FORMATS = new Set(['gif', 'jpg', 'jpeg']);

const INDUSTRY_VARIANTS = new Set(['blur', 'yellow', 'white']);

function imageRequiredForPosition(position) {
  const pos = String(position || '').toLowerCase();
  if (POSITIONS_WITHOUT_IMAGE.has(pos)) return false;
  if (POSITIONS_OPTIONAL_IMAGE.has(pos)) return false;
  return true;
}

function isSingleRecordPosition(position) {
  return SINGLE_RECORD_POSITIONS.has(String(position || '').toLowerCase());
}

function maxRecordsForPosition(position) {
  const pos = String(position || '').toLowerCase();
  if (SINGLE_RECORD_POSITIONS.has(pos)) return 1;
  return null;
}

module.exports = {
  HOMEPAGE_BANNER_POSITIONS,
  POSITIONS_WITHOUT_IMAGE,
  POSITIONS_OPTIONAL_IMAGE,
  SINGLE_RECORD_POSITIONS,
  CAKE_IMAGE_FORMATS,
  INDUSTRY_VARIANTS,
  imageRequiredForPosition,
  isSingleRecordPosition,
  maxRecordsForPosition,
};
