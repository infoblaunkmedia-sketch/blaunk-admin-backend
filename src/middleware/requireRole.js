const ROLES = {
  ADMIN: 'admin',
  EMP: 'emp',
  THREE_P: '3p',
};

/** Maps login/JWT aliases → canonical role. */
const ROLE_ALIASES = {
  admin: ROLES.ADMIN,
  emp: ROLES.EMP,
  employee: ROLES.EMP,
  user: ROLES.EMP,
  '3p': ROLES.THREE_P,
  '3pc': ROLES.THREE_P,
  dsa: ROLES.THREE_P,
};

/**
 * @param {import('express').Request['user']} user
 * @returns {'admin'|'emp'|'3p'|null}
 */
function normalizeAuthRole(user) {
  if (!user) return null;
  const rawRole = String(user.role || '').toLowerCase();
  if (rawRole === 'admin') return ROLES.ADMIN;
  const empType = String(user.employeeType || '').toLowerCase();
  if (empType === '3pc') return ROLES.THREE_P;
  const mapped = ROLE_ALIASES[rawRole];
  if (mapped) return mapped;
  return ROLES.EMP;
}

/**
 * Subject code for scoping 3P/DSA-owned records (payouts, sliders).
 * @param {import('express').Request['user']} user
 */
function getSubjectCode(user) {
  if (!user) return '';
  return String(user.employeeCode || user.username || '').trim().toUpperCase();
}

function isAdminUser(user) {
  return normalizeAuthRole(user) === ROLES.ADMIN;
}

function is3pUser(user) {
  return normalizeAuthRole(user) === ROLES.THREE_P;
}

/**
 * @param {...string} allowedRoles - e.g. 'admin', 'emp', '3p' (aliases accepted)
 */
function requireRole(...allowedRoles) {
  const allowed = new Set(
    allowedRoles.map((r) => {
      const key = String(r || '').toLowerCase();
      return ROLE_ALIASES[key] || key;
    }),
  );

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const role = normalizeAuthRole(req.user);
    if (!role || !allowed.has(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.authRole = role;
    req.subjectCode = getSubjectCode(req.user);
    return next();
  };
}

const requireAdmin = requireRole(ROLES.ADMIN);

module.exports = {
  ROLES,
  ROLE_ALIASES,
  normalizeAuthRole,
  getSubjectCode,
  isAdminUser,
  is3pUser,
  requireRole,
  requireAdmin,
};
