const referralService = require('../services/referralService');
const { isAdminUser, is3pUser, getSubjectCode } = require('../middleware/requireRole');

async function trackReferralController(req, res) {
  try {
    const record = await referralService.trackReferral(req.body);
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to track referral.' });
  }
}

async function listReferralsController(req, res) {
  try {
    let dsaCode = req.query?.dsaCode;
    if (!isAdminUser(req.user)) {
      dsaCode = getSubjectCode(req.user);
      if (!dsaCode) return res.status(403).json({ message: 'DSA code not configured.' });
    }
    const result = await referralService.listReferrals({ ...req.query, dsaCode });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list referrals.' });
  }
}

async function ledgerController(req, res) {
  try {
    const dsaCode = isAdminUser(req.user) ? req.query?.dsaCode : getSubjectCode(req.user);
    if (!isAdminUser(req.user) && !dsaCode) {
      return res.status(403).json({ message: 'DSA code not configured.' });
    }
    const ledger = await referralService.getCommissionLedger(dsaCode);
    return res.json({ ledger });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load ledger.' });
  }
}

module.exports = { trackReferralController, listReferralsController, ledgerController };
