/**
 * Mirrors admin frontend moduleRights — backend is source of truth for API access.
 */

const TOP_LEVEL_MODULES = new Set([
  'dashboard',
  'cms',
  'people',
  'channelPartners',
  'finance',
  'platform',
  'marketing',
  'customers',
  'reports',
  'corporate',
  'settings',
  'adminPersonnel',
]);

function sectionPermissionKey(module, childKey) {
  return `${module}:${childKey}`;
}

function hasModuleAccess(sections, module) {
  const list = Array.isArray(sections) ? sections : [];
  if (list.includes(module)) return true;
  const prefix = `${module}:`;
  return list.some((p) => String(p).startsWith(prefix));
}

function hasSectionAccess(sections, module, childKey) {
  const list = Array.isArray(sections) ? sections : [];
  if (list.includes(module)) return true;
  return list.includes(sectionPermissionKey(module, childKey));
}

function isKnownSection(value) {
  const s = String(value || '').trim();
  if (!s) return false;
  if (TOP_LEVEL_MODULES.has(s)) return true;
  const i = s.indexOf(':');
  if (i <= 0) return false;
  return TOP_LEVEL_MODULES.has(s.slice(0, i));
}

module.exports = {
  TOP_LEVEL_MODULES,
  sectionPermissionKey,
  hasModuleAccess,
  hasSectionAccess,
  isKnownSection,
};
