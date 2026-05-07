const net = require('net');
const AllowedIp = require('../models/AllowedIp');
const { matchRule } = require('../utils/ipMatch');

function assertValidIpOrCidr(value) {
  const v = String(value || '').trim();
  if (!v) {
    const err = new Error('ip_address is required');
    err.statusCode = 400;
    throw err;
  }
  if (v.includes('/')) {
    const [base, bitsRaw] = v.split('/');
    const baseTrim = String(base || '').trim();
    if (!net.isIPv4(baseTrim)) {
      const err = new Error('CIDR must use a valid IPv4 base address');
      err.statusCode = 400;
      throw err;
    }
    const bits = parseInt(String(bitsRaw || '').trim(), 10);
    if (Number.isNaN(bits) || bits < 0 || bits > 32) {
      const err = new Error('CIDR mask must be between 0 and 32');
      err.statusCode = 400;
      throw err;
    }
    return v;
  }
  if (!net.isIP(v)) {
    const err = new Error('Invalid IP address');
    err.statusCode = 400;
    throw err;
  }
  return v;
}

/**
 * When the collection is empty → allow all (bootstrap).
 * When there are rows but none are active → allow all (whitelist paused).
 * When there is at least one active row → client must match at least one (exact IP or IPv4 CIDR).
 */
async function isRequestAllowed(clientIp) {
  const total = await AllowedIp.countDocuments();
  if (total === 0) return true;

  const all = await AllowedIp.find({}).lean();
  const rules = all.filter((d) => d.active !== false);
  if (rules.length === 0) return true;

  const c = String(clientIp || '').trim();
  if (!c) return false;
  return rules.some((row) => matchRule(row.ipAddress, c));
}

/**
 * Add or update an allowed IP (upsert by ip_address).
 */
async function addAllowedIp(serviceProvider, ipAddress, options = {}) {
  const normalizedIp = assertValidIpOrCidr(ipAddress);
  const activeFlag = options.active === undefined ? true : !!options.active;
  const addedBy = String(options.addedBy || '').trim();

  const $set = {
    serviceProvider: String(serviceProvider || '').trim(),
    active: activeFlag,
  };
  if (addedBy) $set.addedBy = addedBy;

  const doc = await AllowedIp.findOneAndUpdate(
    { ipAddress: normalizedIp },
    { $set },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return mapDoc(doc);
}

async function updateAllowedIp(id, patch) {
  if (!id || typeof id !== 'string') {
    const err = new Error('Valid id is required');
    err.statusCode = 400;
    throw err;
  }
  const row = await AllowedIp.findById(id).lean();
  if (!row) {
    const err = new Error('IP entry not found');
    err.statusCode = 404;
    throw err;
  }

  const $set = {};
  if (patch.serviceProvider !== undefined) {
    $set.serviceProvider = String(patch.serviceProvider || '').trim();
  }
  if (patch.active !== undefined) {
    $set.active = !!patch.active;
  }
  if (patch.ipAddress !== undefined) {
    $set.ipAddress = assertValidIpOrCidr(patch.ipAddress);
  }

  if (Object.keys($set).length === 0) {
    return mapDoc(row);
  }

  try {
    const updated = await AllowedIp.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: 'after' },
    ).lean();
    return mapDoc(updated);
  } catch (e) {
    if (e && e.code === 11000) {
      const err = new Error('Another row already uses this IP/CIDR');
      err.statusCode = 400;
      throw err;
    }
    throw e;
  }
}

function mapDoc(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    service_provider: doc.serviceProvider ?? '',
    ip_address: doc.ipAddress ?? '',
    active: doc.active !== false,
    added_by: doc.addedBy ?? '',
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
  };
}

/**
 * Full list for admin UI (includes inactive rows).
 */
async function getAllowedIps() {
  const list = await AllowedIp.find({}).sort({ createdAt: 1 }).lean();
  return list.map((doc) => mapDoc(doc));
}

async function deleteAllowedIp(id) {
  if (!id || typeof id !== 'string') {
    const err = new Error('Valid id is required');
    err.statusCode = 400;
    throw err;
  }
  const result = await AllowedIp.findByIdAndDelete(id);
  return !!result;
}

/** @deprecated use isRequestAllowed — kept for any external callers */
async function isIpAllowed(ipAddress) {
  return isRequestAllowed(ipAddress);
}

module.exports = {
  addAllowedIp,
  getAllowedIps,
  deleteAllowedIp,
  updateAllowedIp,
  isRequestAllowed,
  isIpAllowed,
  assertValidIpOrCidr,
};
