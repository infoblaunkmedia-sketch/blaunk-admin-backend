const { ROLES, normalizeAuthRole, getSubjectCode } = require('./requireRole');

/**
 * For 3P users, forces query/body dsaCode to the authenticated subject code.
 * Admin and internal employees are not scoped.
 */
function scopeDsaCodeQuery(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const role = normalizeAuthRole(req.user);
  if (role !== ROLES.THREE_P) {
    return next();
  }
  const own = getSubjectCode(req.user);
  if (!own) {
    return res.status(403).json({ message: 'DSA code is not configured for this account.' });
  }
  req.query = { ...req.query, dsaCode: own };
  req.subjectCode = own;
  return next();
}

/**
 * Ensures 3P cannot mutate another DSA's payout by id (used before approve/reject for defense in depth).
 */
async function assertOwnPayout(req, payout) {
  const role = normalizeAuthRole(req.user);
  if (role !== ROLES.THREE_P) return true;
  const own = getSubjectCode(req.user);
  return String(payout?.dsaCode || '').toUpperCase() === own;
}

module.exports = {
  scopeDsaCodeQuery,
  assertOwnPayout,
};
