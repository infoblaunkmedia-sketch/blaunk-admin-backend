const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateTempPassword } = require('../services/userProvisionService');
const userProvisionService = require('../services/userProvisionService');

function normalizeType(type) {
  return String(type || '').toLowerCase() === '3pc' ? '3pc' : 'employee';
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

async function getUserByCodeController(req, res) {
  const code = normalizeCode(req.params.code);
  if (!code) return res.status(400).json({ message: 'Employee code is required.' });

  const type = normalizeType(req.query.type);
  const user = await User.findOne({ username: code, employeeType: type }).lean();
  if (!user) return res.status(404).json({ message: 'User not found.' });

  return res.json({
    user: {
      username: user.username,
      employeeCode: user.employeeCode || user.username,
      employeeType: user.employeeType || 'employee',
      status: user.status || 'Active',
      passwordResetRequired: !!user.passwordResetRequired,
      passwordIssuedAt: user.passwordIssuedAt || null,
      passwordIssuedBy: user.passwordIssuedBy || '',
      lastPasswordChangeAt: user.lastPasswordChangeAt || null,
    },
  });
}

async function patchUserStatusController(req, res) {
  const code = normalizeCode(req.params.code);
  if (!code) return res.status(400).json({ message: 'Employee code is required.' });
  const type = normalizeType(req.query.type || req.body?.type);

  const status = String(req.body?.status || '').trim();
  if (!['Active', 'Disabled'].includes(status)) {
    return res.status(400).json({ message: 'status must be Active or Disabled.' });
  }

  await userProvisionService.ensureUserForEmployeeCode(code, type);
  const updated = await User.findOneAndUpdate(
    { username: code, employeeType: type },
    { $set: { status } },
    { returnDocument: 'after' },
  ).lean();
  if (!updated) return res.status(404).json({ message: 'User not found.' });

  return res.json({ success: true });
}

async function generateTempPasswordController(req, res) {
  const code = normalizeCode(req.params.code);
  if (!code) return res.status(400).json({ message: 'Employee code is required.' });
  const type = normalizeType(req.query.type || req.body?.type);

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);
  const issuedBy = String(req.user?.username || req.user?.id || 'admin');
  await userProvisionService.ensureUserForEmployeeCode(code, type);

  const updated = await User.findOneAndUpdate(
    { username: code, employeeType: type },
    {
      $set: {
        passwordHash,
        passwordResetRequired: false,
        passwordIssuedAt: new Date(),
        passwordIssuedBy: issuedBy,
      },
    },
    { returnDocument: 'after', upsert: false },
  ).lean();

  if (!updated) return res.status(404).json({ message: 'User not found.' });

  return res.json({ tempPassword });
}

module.exports = {
  getUserByCodeController,
  patchUserStatusController,
  generateTempPasswordController,
};

