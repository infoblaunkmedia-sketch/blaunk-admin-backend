const publicSlotService = require('../services/publicSlotService');

async function slotContentController(req, res) {
  const { page, position, country } = req.query || {};
  try {
    const payload = await publicSlotService.getMergedSlotContent({ page, position, country });
    return res.json(payload);
  } catch (err) {
    const msg = String(err?.message || 'Failed to load slot content.');
    const status = msg.toLowerCase().includes('required') ? 400 : 500;
    return res.status(status).json({ message: msg });
  }
}

module.exports = {
  slotContentController,
};
