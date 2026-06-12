const MacAddressConfig = require('../models/MacAddressConfig');
const { macEquals, normalizeMac } = require('../utils/macAddress');

function isEnforcementEnabled() {
  const raw = String(process.env.MAC_LOGIN_ENFORCEMENT ?? 'true').trim().toLowerCase();
  return raw !== 'false' && raw !== '0' && raw !== 'off';
}

async function getActiveRegisteredMacs(linkedType, linkedCode) {
  const type = linkedType === '3pc' ? '3pc' : 'employee';
  const code = String(linkedCode || '').trim().toUpperCase();
  if (!code) return [];

  const escaped = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rows = await MacAddressConfig.find({
    forItManagement: true,
    forRights: { $ne: true },
    linkedType: type,
    linkedCode: new RegExp(`^${escaped}$`, 'i'),
    status: 'Active',
  })
    .select('macAddress')
    .lean();

  return rows
    .map((r) => normalizeMac(r.macAddress))
    .filter(Boolean);
}

/**
 * IT → MAC Address: when active MAC(s) exist for the employee/3P, login is allowed
 * only from a device whose MAC matches one of those rows.
 */
async function evaluateLoginMac({ linkedType, linkedCode, clientMac }) {
  if (!isEnforcementEnabled()) {
    return { allowed: true, reason: 'disabled' };
  }

  const registered = await getActiveRegisteredMacs(linkedType, linkedCode);
  if (!registered.length) {
    return { allowed: true, reason: 'no_devices_registered' };
  }

  const client = normalizeMac(clientMac);
  if (!client) {
    return {
      allowed: false,
      reason: 'missing_client_mac',
      message:
        'Access denied: login is only allowed from your IT-approved laptop. Use your registered device or contact IT.',
    };
  }

  const match = registered.some((mac) => macEquals(mac, client));
  if (!match) {
    return {
      allowed: false,
      reason: 'mac_mismatch',
      message:
        'Access denied: this laptop is not approved for your account. Use your registered device or contact IT.',
    };
  }

  return { allowed: true, reason: 'ok' };
}

module.exports = {
  isEnforcementEnabled,
  getActiveRegisteredMacs,
  evaluateLoginMac,
};
