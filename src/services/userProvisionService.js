const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const EmployeeCredentials = require('../models/EmployeeCredentials');

function generateTempPassword() {
  // 10 chars, URL-safe-ish, easy to read/copy
  return crypto.randomBytes(8).toString('base64url').slice(0, 10);
}

async function ensureUserForEmployeeCode(employeeCode, employeeType) {
  const code = String(employeeCode || '').trim().toUpperCase();
  if (!code) throw new Error('employeeCode is required');

  const type = employeeType === '3pc' ? '3pc' : 'employee';

  // Try to fetch HR email/name to populate user email.
  let email = `${code.toLowerCase()}@example.com`;
  try {
    const cred = await EmployeeCredentials.findOne(
      { empCode: code },
      { email: 1 },
    ).lean();
    if (cred?.email) email = String(cred.email).trim().toLowerCase();
  } catch {
    // ignore lookup errors, keep fallback email
  }

  const existing = await User.findOne({ username: code }).lean();
  if (existing) return { user: existing, tempPassword: null };

  const bootstrapPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(bootstrapPassword, 10);

  const user = await User.findOneAndUpdate(
    { username: code },
    {
      $setOnInsert: {
        username: code,
        email,
        passwordHash,
        role: 'user',
        status: 'Active',
        employeeCode: code,
        employeeType: type,
        passwordResetRequired: false,
        passwordIssuedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  ).lean();

  return { user, tempPassword: null };
}

module.exports = {
  ensureUserForEmployeeCode,
  generateTempPassword,
};

