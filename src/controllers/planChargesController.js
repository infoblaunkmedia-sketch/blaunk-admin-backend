const planChargesService = require('../services/planChargesService');

async function listPlanChargesController(req, res) {
  try {
    const plans = await planChargesService.listAllPlansAdmin();
    return res.json({ plans });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('listPlanCharges error:', err);
    return res.status(500).json({ message: 'Failed to load plan charges.' });
  }
}

async function patchPlanChargeController(req, res) {
  try {
    const plan = await planChargesService.updatePlanById(req.params.id, req.body || {});
    return res.json({ plan });
  } catch (err) {
    const msg = String(err?.message || 'Failed to update plan charge.');
    const status = msg.includes('not found') ? 404 : msg.includes('number') || msg.includes('fields') ? 400 : 500;
    return res.status(status).json({ message: msg });
  }
}

module.exports = {
  listPlanChargesController,
  patchPlanChargeController,
};
