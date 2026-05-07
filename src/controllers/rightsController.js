const rightsService = require('../services/rightsService');
const userProvisionService = require('../services/userProvisionService');

async function saveRightsController(req, res) {
  const { employeeCode, type, sections, macAddress } = req.body || {};

  if (!employeeCode || !type) {
    return res.status(400).json({ message: 'employeeCode and type are required.' });
  }

  if (!['employee', '3pc'].includes(type)) {
    return res.status(400).json({ message: 'type must be "employee" or "3pc".' });
  }

  try {
    const record = await rightsService.saveRights(
      String(employeeCode).trim(),
      type,
      Array.isArray(sections) ? sections : [],
      macAddress,
    );
    // Ensure employee can log in after rights assignment (default captcha password).
    await userProvisionService.ensureUserForEmployeeCode(employeeCode, type);
    return res.json({ record });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('saveRights error:', error);
    return res.status(500).json({ message: 'Failed to save rights.' });
  }
}

async function getRightsController(req, res) {
  const { type, code } = req.params;
  if (!type || !code) {
    return res.status(400).json({ message: 'type and code are required.' });
  }
  const normalizedType = type === '3pc' ? '3pc' : 'employee';
  try {
    const { sections, macAddress } = await rightsService.getRights(code, normalizedType);
    return res.json({ sections, macAddress: macAddress || '' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getRights error:', error);
    return res.status(500).json({ message: 'Failed to load rights.' });
  }
}

async function getMyRightsController(req, res) {
  try {
    const sections = await rightsService.getRightsForUser(req.user);
    return res.json({ sections });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getMyRights error:', error);
    return res.status(500).json({ message: 'Failed to load your rights.' });
  }
}

module.exports = {
  saveRightsController,
  getRightsController,
  getMyRightsController,
};
