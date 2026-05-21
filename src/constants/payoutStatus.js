const PAYOUT_STATUSES = [
  'PENDING',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'REVERSE_BACK',
  'ON_HOLD',
  'DOUBLE_ENTRY',
  'ENTRY_MISSING',
];

const STATUS = {
  PENDING: 'PENDING',
  PENDING_LEGACY: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  REVERSE_BACK: 'REVERSE_BACK',
  ON_HOLD: 'ON_HOLD',
  DOUBLE_ENTRY: 'DOUBLE_ENTRY',
  ENTRY_MISSING: 'ENTRY_MISSING',
};

const ALIASES = {
  PENDING: 'PENDING',
  PENDING_APPROVAL: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  REVERSE_BACK: 'REVERSE_BACK',
  ON_HOLD: 'ON_HOLD',
  DOUBLE_ENTRY: 'DOUBLE_ENTRY',
  ENTRY_MISSING: 'ENTRY_MISSING',
};

function normalizePayoutStatus(raw) {
  const key = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  return ALIASES[key] || null;
}

function isNegativeStatus(status) {
  return status === STATUS.REJECTED || status === STATUS.CANCELLED || status === STATUS.ENTRY_MISSING;
}

module.exports = {
  PAYOUT_STATUSES,
  STATUS,
  normalizePayoutStatus,
  isNegativeStatus,
};
