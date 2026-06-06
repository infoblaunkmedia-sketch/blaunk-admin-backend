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
  'sales',
  'it',
  'payslip',
  'customers',
  'reports',
  'corporate',
  'settings',
  'adminPersonnel',
]);

function sectionPermissionKey(module, childKey) {
  return `${module}:${childKey}`;
}

const MANAGEMENT_LEGACY_SECTIONS = new Set([
  'rights',
  'security',
  'match-code',
]);

function hasModuleAccess(sections, module) {
  const list = Array.isArray(sections) ? sections : [];
  if (list.includes(module)) return true;
  const prefix = `${module}:`;
  if (list.some((p) => String(p).startsWith(prefix))) return true;
  // Legacy: Settings merged into Management (platform)
  if (module === 'platform') {
    if (list.includes('settings')) return true;
    if (list.some((p) => String(p).startsWith('settings:'))) return true;
  }
  if (module === 'it' && list.includes('settings:ip-management')) return true;
  // Legacy: standalone Payslip module grant → People
  if (module === 'people' && list.includes('payslip')) return true;
  return false;
}

function hasSectionAccess(sections, module, childKey) {
  const list = Array.isArray(sections) ? sections : [];
  if (list.includes(module)) return true;
  if (list.includes(sectionPermissionKey(module, childKey))) return true;
  if (module === 'it' && childKey === 'ip-management' && list.includes('settings:ip-management')) {
    return true;
  }
  if (module === 'platform' && MANAGEMENT_LEGACY_SECTIONS.has(childKey)) {
    if (list.includes(`settings:${childKey}`)) return true;
    if (list.includes('settings')) return true;
  }
  if (
    module === 'platform' &&
    childKey === 'match-code' &&
    (list.includes('marketing:match-doe') || list.includes('marketing:match-code'))
  ) {
    return true;
  }
  // Legacy: standalone Payslip module → People → Payroll
  if (module === 'people' && childKey === 'payroll' && list.includes('payslip')) {
    return true;
  }
  return false;
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
