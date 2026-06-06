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

const PAYOUT_REMARK_OPTIONS = [
  'Reversed Back',
  'Duplicate Entry',
  'Journal Voucher Reversal',
  'Management Not Approved',
  'DSA Closed & Transferred',
  'Bank Entry Missing',
];

function isNegativeStatus(status) {
  return status === STATUS.REJECTED;
}

function isValidPayoutRemark(value) {
  const text = String(value || '').trim();
  return PAYOUT_REMARK_OPTIONS.includes(text);
}

module.exports = {
  PAYOUT_STATUSES,
  PAYOUT_REMARK_OPTIONS,
  STATUS,
  normalizePayoutStatus,
  isNegativeStatus,
  isValidPayoutRemark,
};
