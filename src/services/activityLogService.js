const ActivityLog = require('../models/ActivityLog');

function cleanString(v) {
  return String(v == null ? '' : v).trim();
}

function moduleFromPath(pathname) {
  const parts = String(pathname || '')
    .split('/')
    .filter(Boolean);
  if (parts[0] === 'api' && parts[1]) return parts[1];
  return parts[0] || 'api';
}

async function logFromRequest(req) {
  const user = req.user || {};
  const role = cleanString(user.role || user.employeeType || '');
  const performedBy =
    cleanString(user.username) ||
    cleanString(user.employeeCode) ||
    cleanString(user.id) ||
    'system';

  await ActivityLog.create({
    action: `${req.method} ${req.originalUrl || req.path}`,
    performedBy,
    role,
    module: moduleFromPath(req.originalUrl || req.path),
    resourceId: cleanString(req.params?.id),
    timestamp: new Date(),
  });
}

async function listActivityLogs({ fromDate, toDate, q, limit = 5000 } = {}) {
  const query = {};
  const range = buildDateRange(fromDate, toDate);
  if (range) query.timestamp = range;

  const needle = cleanString(q);
  if (needle) {
    const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ action: re }, { performedBy: re }, { module: re }, { role: re }];
  }

  const safeLimit = Math.min(Math.max(parseInt(String(limit), 10) || 5000, 1), 10000);
  const rows = await ActivityLog.find(query).sort({ timestamp: -1 }).limit(safeLimit).lean();
  return rows || [];
}

function buildDateRange(fromDate, toDate) {
  const from = fromDate ? new Date(fromDate) : null;
  const to = toDate ? new Date(toDate) : null;
  if (!from || Number.isNaN(from.getTime()) || !to || Number.isNaN(to.getTime())) return null;
  to.setHours(23, 59, 59, 999);
  return { $gte: from, $lte: to };
}

module.exports = {
  logFromRequest,
  listActivityLogs,
  buildDateRange,
};
