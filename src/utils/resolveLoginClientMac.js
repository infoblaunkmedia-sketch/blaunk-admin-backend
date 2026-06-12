const { normalizeMac } = require('./macAddress');
const { resolveClientMacFromIp } = require('./resolveClientMac');

/**
 * Resolve the employee laptop MAC for login checks.
 * 1) macAddress from login body (local probe on the employee PC)
 * 2) ARP lookup from client IP (office LAN, when API uses server network IP)
 */
function resolveLoginClientMac(req, clientIp) {
  const fromBody = normalizeMac(req.body?.macAddress);
  if (fromBody) return fromBody;
  return resolveClientMacFromIp(clientIp) || '';
}

module.exports = {
  resolveLoginClientMac,
};
