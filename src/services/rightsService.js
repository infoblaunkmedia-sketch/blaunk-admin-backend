const Rights = require('../models/Rights');
const macAddressConfigService = require('./macAddressConfigService');

const ALL_SECTIONS = [
  'dashboard',
  'cms',
  'cms:banners',
  'people',
  'channelPartners',
  'channelPartners:dsa',
  'finance',
  'platform',
  'platform:products',
  'platform:categories',
  'platform:countries',
  'marketing',
  'customers',
  'customers:orders',
  'customers:vendors',
  'reports',
  'corporate',
  'retailManagement',
  'settings',
];

async function saveRights(employeeCode, type, sections, macAddress) {
  const record = await Rights.findOneAndUpdate(
    { employeeCode, type },
    { $set: { sections: sections || [] } },
    { returnDocument: 'after', upsert: true },
  ).lean();
  await macAddressConfigService.upsertMacForRightsSubject(type, employeeCode, macAddress);
  return record;
}

async function getRights(employeeCode, type) {
  const record = await Rights.findOne({ employeeCode, type }).lean();
  const sections = record ? record.sections : [];
  const macAddress = await macAddressConfigService.getMacForRightsSubject(type, employeeCode);
  return { sections, macAddress: macAddress || '' };
}

async function getRightsForUser(user) {
  if (!user) return [];
  const role = String(user.role || '').toLowerCase();
  if (role === 'admin') return ALL_SECTIONS;
  const code = String(user.employeeCode || user.username || '').trim();
  if (!code) return [];
  const type = user.employeeType === '3pc' ? '3pc' : 'employee';
  const { sections } = await getRights(code, type);
  return Array.isArray(sections) ? sections : [];
}

module.exports = {
  saveRights,
  getRights,
  getRightsForUser,
  ALL_SECTIONS,
};
