const matchCodeService = require('../services/matchCodeService');

function isAdmin(req) {
  return String(req.user?.role || '').toLowerCase() === 'admin';
}

async function listHistoryController(req, res) {
  const { limit } = req.query || {};
  try {
    const entries = await matchCodeService.listHistory(limit);
    return res.json({ entries });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load Match Code history.' });
  }
}

async function activeCodeController(req, res) {
  try {
    const entry = await matchCodeService.getActive();
    return res.json({ entry });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load active Match Code.' });
  }
}

async function generateController(req, res) {
  if (!isAdmin(req)) {
    return res.status(403).json({ message: 'Only admin can generate Match Code.' });
  }
  const threePEmplCode = String(req.body?.threePEmplCode || req.body?.generatorFor || '').trim();
  if (!threePEmplCode) {
    return res.status(400).json({ message: '3P employee code is required.' });
  }
  try {
    const { entry, synced3pCount } = await matchCodeService.generateNew(
      req.user?.username || 'admin',
      threePEmplCode,
    );
    return res.status(201).json({ entry, synced3pCount });
  } catch (error) {
    const msg = error?.message || 'Failed to generate Match Code.';
    const status = /required|not found/i.test(msg) ? 400 : 500;
    return res.status(status).json({ message: msg });
  }
}

async function patchStatusController(req, res) {
  const { id } = req.params || {};
  const isActive = req.body?.isActive;
  if (!id) return res.status(400).json({ message: 'id is required.' });
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive must be true or false.' });
  }
  try {
    const entry = await matchCodeService.updateStatusById(id, isActive);
    if (!entry) return res.status(404).json({ message: 'Match Code not found.' });
    return res.json({ entry });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update Match Code status.' });
  }
}

async function validateController(req, res) {
  const code = String(req.query?.code || req.body?.code || '').trim();
  if (!code) return res.status(400).json({ message: 'code is required.' });
  try {
    const valid = await matchCodeService.validateCode(code);
    return res.json({ valid });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to validate Match Code.' });
  }
}

module.exports = {
  listHistoryController,
  activeCodeController,
  generateController,
  validateController,
  patchStatusController,
};
