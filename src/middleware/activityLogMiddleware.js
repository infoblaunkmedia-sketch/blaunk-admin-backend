const activityLogService = require('../services/activityLogService');

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function activityLogMiddleware(req, res, next) {
  if (!MUTATION_METHODS.has(req.method)) return next();
  const path = req.originalUrl || req.path || '';
  if (!path.startsWith('/api/')) return next();

  res.on('finish', () => {
    if (res.statusCode >= 400 || !req.user) return;
    activityLogService.logFromRequest(req).catch(() => undefined);
  });

  return next();
}

module.exports = { activityLogMiddleware };
