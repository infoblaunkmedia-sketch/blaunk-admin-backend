const thirdPartyCredentialService = require('../services/thirdPartyCredentialService');
const userProvisionService = require('../services/userProvisionService');

async function listThirdPartyCredentialsController(req, res) {
  const { q, limit } = req.query || {};
  try {
    const records = await thirdPartyCredentialService.listThirdPartyCredentials({ q, limit });
    return res.json({ records });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listThirdPartyCredentials error:', error);
    return res.status(500).json({ message: 'Failed to list 3P credentials.' });
  }
}

async function getThirdPartyCredentialController(req, res) {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  try {
    const record = await thirdPartyCredentialService.getThirdPartyCredentialById(id);
    if (!record) return res.status(404).json({ message: '3P credential not found.' });
    return res.json({ record });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getThirdPartyCredential error:', error);
    return res.status(500).json({ message: 'Failed to load 3P credential.' });
  }
}

async function saveThirdPartyCredentialController(req, res) {
  try {
    const record = await thirdPartyCredentialService.upsertThirdPartyCredential(req.body || {});
    // If a 3PC employee code is present, ensure they can log in with default captcha password.
    if (record?.threePEmplCode) {
      await userProvisionService.ensureUserForEmployeeCode(record.threePEmplCode, '3pc');
      await userProvisionService.syncUserStatusFor3pc(record.threePEmplCode, record.status);
    }
    return res.status(200).json({ record });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('saveThirdPartyCredential error:', error);
    const msg = String(error?.message || '');
    const lower = msg.toLowerCase();
    const status = lower.includes('required') || lower.includes('match code') ? 400 : 500;
    const clientMsg = msg || 'Failed to save 3P credential.';
    return res.status(status).json({ message: clientMsg });
  }
}

async function deleteThirdPartyCredentialController(req, res) {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  try {
    const deletedCount = await thirdPartyCredentialService.deleteThirdPartyCredentialById(id);
    if (!deletedCount) return res.status(404).json({ message: '3P credential not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('deleteThirdPartyCredential error:', error);
    return res.status(500).json({ message: 'Failed to delete 3P credential.' });
  }
}

module.exports = {
  listThirdPartyCredentialsController,
  getThirdPartyCredentialController,
  saveThirdPartyCredentialController,
  deleteThirdPartyCredentialController,
};

