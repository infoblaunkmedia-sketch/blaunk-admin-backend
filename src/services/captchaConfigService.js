const CaptchaConfig = require('../models/CaptchaConfig');

const SECURITY_CODES = [
  'Management',
  'Finance',
  'M & A',
  'Sales',
  'Company Secretary',
  'HR',
  'Payslip',
  'IT Dept',
  'Admin & Personnel',
  'Customer Care',
  'Retail Shop',
  'DSA',
  'Verifier',
  'RETAIL MANAGEMENT',
];

async function getAll() {
  const list = await CaptchaConfig.find({}).lean();
  const map = new Map((list || []).map((doc) => [doc.securityCode, doc.captcha || '']));
  return SECURITY_CODES.map((securityCode) => ({
    securityCode,
    captcha: map.get(securityCode) || '',
  }));
}

async function saveAll(configs) {
  if (!Array.isArray(configs)) return getAll();
  for (const item of configs) {
    if (item && item.securityCode != null) {
      await CaptchaConfig.findOneAndUpdate(
        { securityCode: item.securityCode },
        { $set: { captcha: item.captcha != null ? String(item.captcha) : '' } },
        { returnDocument: 'after', upsert: true },
      );
    }
  }
  return getAll();
}

module.exports = {
  getAll,
  saveAll,
  SECURITY_CODES,
};
