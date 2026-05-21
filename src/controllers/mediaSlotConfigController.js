const mediaSlotConfigService = require('../services/mediaSlotConfigService');

function isAllowedManager(req) {
  const role = String(req.user?.role || '').toLowerCase();
  if (role === 'admin' || role === 'marketing') return true;
  const type = String(req.user?.employeeType || '').toLowerCase();
  return type === '3pc';
}

async function listConfigsController(req, res) {
  try {
    const configs = await mediaSlotConfigService.listConfigs();
    return res.json({ configs });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listMediaSlotConfigs error:', error);
    return res.status(500).json({ message: 'Failed to load slot configuration.' });
  }
}

async function saveConfigsController(req, res) {
  if (!isAllowedManager(req)) {
    return res.status(403).json({ message: 'Only admin/3P users can change slot limits.' });
  }
  try {
    const body = req.body || {};
    const configs = Array.isArray(body.configs) ? body.configs : Array.isArray(body) ? body : null;
    if (!configs) return res.status(400).json({ message: 'configs array is required.' });
    const updated = await mediaSlotConfigService.saveConfigs(configs);
    return res.json({ configs: updated });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('must') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to save slot configuration.' });
  }
}

module.exports = { listConfigsController, saveConfigsController };
