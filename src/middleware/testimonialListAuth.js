const authService = require('../services/authService');
const { normalizeAuthRole, getSubjectCode } = require('./requireRole');

/**
 * Sets req.testimonialsPublicList = true when the request should receive the public payload
 * (no Bearer, or invalid/expired token — safe for consumer sites).
 */
async function testimonialListAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    req.testimonialsPublicList = true;
    return next();
  }

  try {
    const user = await authService.verifyToken(header.slice(7));
    req.user = user;
    req.authRole = normalizeAuthRole(user);
    req.subjectCode = getSubjectCode(user);
    req.testimonialsPublicList = false;
    return next();
  } catch {
    req.testimonialsPublicList = true;
    return next();
  }
}

module.exports = { testimonialListAuth };
