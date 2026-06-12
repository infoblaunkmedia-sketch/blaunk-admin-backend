/** Strip separators and return uppercase hex (12 or 16 chars) or empty if invalid. */
function normalizeMac(raw) {
  const hex = String(raw || '').replace(/[^0-9a-f]/gi, '');
  if (hex.length === 12 || hex.length === 16) return hex.toUpperCase();
  return '';
}

/** Display as AA-BB-CC-DD-EE-FF (pairs of two). */
function formatMacDisplay(normalizedOrRaw) {
  const n = normalizeMac(normalizedOrRaw);
  if (!n) return String(normalizedOrRaw || '').trim();
  const pairs = n.match(/.{1,2}/g) || [];
  return pairs.join('-');
}

function macEquals(a, b) {
  const na = normalizeMac(a);
  const nb = normalizeMac(b);
  if (!na || !nb) return false;
  return na === nb;
}

module.exports = {
  normalizeMac,
  formatMacDisplay,
  macEquals,
};
