const dsaPayoutService = require('../services/dsaPayoutService');
const { isAdminUser, is3pUser, getSubjectCode } = require('../middleware/requireRole');

async function listPayoutsController(req, res) {
  const { dsaCode, status, limit } = req.query || {};
  try {
    let resolvedDsaCode = dsaCode;
    if (!isAdminUser(req.user)) {
      const ownCode = getSubjectCode(req.user);
      if (!ownCode) {
        return res.status(403).json({ message: 'Only users mapped with a DSA code can access payouts.' });
      }
      resolvedDsaCode = ownCode;
    }
    const records = await dsaPayoutService.listPayouts({ dsaCode: resolvedDsaCode, status, limit });
    return res.json({ records });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listPayouts error:', error);
    return res.status(500).json({ message: 'Failed to list payouts.' });
  }
}

async function createPayoutController(req, res) {
  try {
    const ownCode = getSubjectCode(req.user);
    if (!isAdminUser(req.user) && !ownCode) {
      return res.status(403).json({ message: 'Only users mapped with a DSA code can create payouts.' });
    }
    const payload = {
      ...(req.body || {}),
      ...(!isAdminUser(req.user) ? { dsaCode: ownCode } : {}),
    };
    const record = await dsaPayoutService.createPayout(payload);
    return res.status(201).json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('required') || msg.toLowerCase().includes('must')
      ? 400
      : 500;
    return res.status(status).json({ message: msg || 'Failed to create payout.' });
  }
}

async function approvePayoutController(req, res) {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  try {
    const record = await dsaPayoutService.approvePayoutById(id, req.body?.note || '', req.user?.username || '');
    if (!record) return res.status(404).json({ message: 'Payout not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to approve payout.' });
  }
}

async function rejectPayoutController(req, res) {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  try {
    const record = await dsaPayoutService.rejectPayoutById(id, req.body?.reason || '', req.user?.username || '');
    if (!record) return res.status(404).json({ message: 'Payout not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to reject payout.' });
  }
}

async function updatePayoutStatusController(req, res) {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  const status = req.body?.status;
  if (!status) return res.status(400).json({ message: 'status is required.' });
  try {
    const record = await dsaPayoutService.updatePayoutStatusById(
      id,
      status,
      req.body?.note || req.body?.reason || '',
      req.user?.username || '',
    );
    if (!record) return res.status(404).json({ message: 'Payout not found.' });
    return res.json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const code = msg.toLowerCase().includes('invalid') ? 400 : 500;
    return res.status(code).json({ message: msg || 'Failed to update payout status.' });
  }
}

module.exports = {
  listPayoutsController,
  createPayoutController,
  approvePayoutController,
  rejectPayoutController,
  updatePayoutStatusController,
};
