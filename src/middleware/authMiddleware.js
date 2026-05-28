const authService = require('../services/authService');

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header.' });
  }

  const token = header.slice(7);

  try {
    const user = await authService.verifyToken(token);
    req.user = user;
    const { normalizeAuthRole, getSubjectCode } = require('./requireRole');
    req.authRole = normalizeAuthRole(user);
    req.subjectCode = getSubjectCode(user);
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = {
  authMiddleware,
};

