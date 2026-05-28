const rightsService = require('../services/rightsService');
const { hasModuleAccess, hasSectionAccess } = require('../utils/permissions');
const { normalizeAuthRole, ROLES } = require('./requireRole');

async function loadUserSections(req) {
  if (Array.isArray(req.userSections)) return req.userSections;
  const sections = await rightsService.getRightsForUser(req.user);
  req.userSections = sections;
  return sections;
}

/**
 * Requires module access from Rights collection (admin bypasses).
 * @param {string} module
 */
function requireModule(module) {
  const mod = String(module || '').trim();
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (normalizeAuthRole(req.user) === ROLES.ADMIN) {
      return next();
    }
    try {
      const sections = await loadUserSections(req);
      if (!hasModuleAccess(sections, mod)) {
        return res.status(403).json({ message: 'Forbidden: insufficient module access.' });
      }
      return next();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('requireModule error:', error);
      return res.status(500).json({ message: 'Failed to verify permissions.' });
    }
  };
}

/**
 * Requires section access (module:section or whole module grant). Admin bypasses.
 * @param {string} module
 * @param {string} sectionKey
 */
function requireSection(module, sectionKey) {
  const mod = String(module || '').trim();
  const section = String(sectionKey || '').trim();
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (normalizeAuthRole(req.user) === ROLES.ADMIN) {
      return next();
    }
    try {
      const sections = await loadUserSections(req);
      if (!hasSectionAccess(sections, mod, section)) {
        return res.status(403).json({ message: 'Forbidden: insufficient section access.' });
      }
      return next();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('requireSection error:', error);
      return res.status(500).json({ message: 'Failed to verify permissions.' });
    }
  };
}

/**
 * Internal employees need Rights section grant; 3P/DSA bypass (own-portal APIs).
 */
function requireSectionOr3p(module, sectionKey) {
  const sectionMw = requireSection(module, sectionKey);
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (normalizeAuthRole(req.user) === ROLES.THREE_P) {
      return next();
    }
    return sectionMw(req, res, next);
  };
}

module.exports = {
  loadUserSections,
  requireModule,
  requireSection,
  requireSectionOr3p,
};
