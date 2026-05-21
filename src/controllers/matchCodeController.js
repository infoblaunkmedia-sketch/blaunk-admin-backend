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
  try {
    const entry = await matchCodeService.generateNew(req.user?.username || 'admin');
    return res.status(201).json({ entry });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate Match Code.' });
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
};
