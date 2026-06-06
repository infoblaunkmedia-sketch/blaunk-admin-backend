const ipWhitelistService = require('../services/ipWhitelistService');
const authService = require('../services/authService');

/**
 * Extracts the client's real IP from the request.
 * Supports x-forwarded-for (first IP when behind Nginx/reverse proxy) and req.socket.remoteAddress.
 * @param {import('express').Request} req
 * @returns {string}
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
    const ip = (first || '').trim();
    if (ip) return ip;
  }
  const realIp = req.headers['x-real-ip'];
  if (realIp && typeof realIp === 'string') {
    const ip = realIp.trim();
    if (ip) return ip;
  }
  const socketAddr = req.socket?.remoteAddress;
  if (socketAddr) {
    return socketAddr.replace(/^::ffff:/, '');
  }
  return '';
}

function requestPathname(req) {
  const raw = typeof req.originalUrl === 'string' ? req.originalUrl : req.url || '';
  const [pathname] = raw.split('?');
  return pathname || '/';
}

/**
 * Bypass IP restrictions for admin-only login URL (no Bearer yet).
 * All other traffic for signed-in admins uses Bearer + role bypass below.
 */
function shouldBypassWhitelist(req) {
  const path = requestPathname(req);
  const method = (req.method || 'GET').toUpperCase();

  if (path === '/health') return true;
  if (path === '/admin' || path.startsWith('/admin/')) return true;

  // Auth endpoints are handled explicitly (admin + 3PC bypass, employee enforced in controller)
  if (path === '/api/auth/login' && method === 'POST') return true;
  if (path === '/api/auth/admin/login' && method === 'POST') return true;
  if (path === '/api/auth/forgot-password' && method === 'POST') return true;
  if (path === '/api/auth/reset-password' && method === 'POST') return true;

  if (path.startsWith('/api/products/public')) return true;
  if (path.startsWith('/api/categories/public')) return true;
  if (path.startsWith('/api/banners/public')) return true;
  if (path.startsWith('/api/giff/public')) return true;
  if (path.startsWith('/api/site-media/public')) return true;
  if (path.startsWith('/api/contest-quiz/public')) return true;
  if (path.startsWith('/api/vacancies/public')) return true;
  if (path.startsWith('/api/testimonials/public')) return true;
  if (path === '/api/testimonials' && method === 'GET') return true;
  if (path === '/api/referrals/track' && method === 'POST') return true;
  if (path.startsWith('/api/dsa-sliders/public')) return true;
  if (path.startsWith('/api/public/slot-content')) return true;
  if (path.startsWith('/api/shops/public')) return true;
  if (path === '/api/shops/register' && method === 'POST') return true;
  if (path.startsWith('/api/shop-categories/public')) return true;
  return false;
}

/**
 * Apply office IP whitelist ONLY for internal employees.
 * - Admin: bypass
 * - 3P employees: bypass
 * - Employees/DSA: enforced
 */
async function getBearerUser(req) {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(7);
  try {
    return await authService.verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Middleware: office IP whitelist for API traffic (see ipWhitelistService).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function checkIPWhitelist(req, res, next) {
  if (shouldBypassWhitelist(req)) {
    return next();
  }

  try {
    const bearerUser = await getBearerUser(req);
    if (bearerUser?.role === 'admin') return next();
    if (String(bearerUser?.employeeType || '').toLowerCase() === '3pc') return next();

    const clientIp = getClientIp(req);
    const permitted = await ipWhitelistService.isRequestAllowed(clientIp);
    if (!permitted) {
      return res.status(403).json({
        message: 'Access Denied: Unauthorized IP',
      });
    }
    next();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('checkIPWhitelist error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getClientIp,
  checkIPWhitelist,
  shouldBypassWhitelist,
  requestPathname,
};
