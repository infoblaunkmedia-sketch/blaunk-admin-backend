const net = require('net');

/**
 * Parse IPv4 string to unsigned 32-bit int. Returns null if invalid.
 */
function parseIPv4(ip) {
  const s = String(ip || '').trim();
  if (!net.isIPv4(s)) return null;
  const parts = s.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * True if `clientIp` (IPv4) is inside `cidr` (e.g. 10.0.0.0/24).
 */
function ipv4InCidr(cidr, clientIp) {
  const [base, bitsRaw] = String(cidr || '').trim().split('/');
  const bits = parseInt(bitsRaw, 10);
  const baseInt = parseIPv4(base);
  const ipInt = parseIPv4(clientIp);
  if (baseInt === null || ipInt === null || Number.isNaN(bits) || bits < 0 || bits > 32) {
    return false;
  }
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (baseInt & mask) === (ipInt & mask);
}

/**
 * One whitelist rule: exact IPv4/IPv6 string, or IPv4 CIDR.
 */
function matchRule(rule, clientIp) {
  const r = String(rule || '').trim();
  const c = String(clientIp || '').trim();
  if (!r || !c) return false;
  if (r.includes('/')) {
    return ipv4InCidr(r, c);
  }
  return r === c;
}

module.exports = {
  parseIPv4,
  ipv4InCidr,
  matchRule,
};
