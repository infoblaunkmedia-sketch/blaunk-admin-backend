const authService = require('../services/authService');

/** Sets req.user when Bearer token is valid; continues without user when missing/invalid. */
async function optionalAuthMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return next();
  }

  const token = header.slice(7);
  try {
    const user = await authService.verifyToken(token);
    req.user = user;
    const { normalizeAuthRole, getSubjectCode } = require('./requireRole');
    req.authRole = normalizeAuthRole(user);
    req.subjectCode = getSubjectCode(user);
  } catch {
    // ignore invalid token for public contest submit
  }
  return next();
}

module.exports = { optionalAuthMiddleware };
