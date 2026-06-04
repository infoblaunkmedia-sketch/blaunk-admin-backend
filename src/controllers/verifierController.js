const verifierService = require('../services/verifierService');
const { normalizeAuthRole, ROLES, getSubjectCode } = require('../middleware/requireRole');
const rightsService = require('../services/rightsService');
const { hasSectionAccess } = require('../utils/permissions');

async function userCanReview(req) {
  if (normalizeAuthRole(req.user) === ROLES.ADMIN) return true;
  const sections = await rightsService.getRightsForUser(req.user);
  return hasSectionAccess(sections, 'adminPersonnel', 'media');
}

function actorCode(req) {
  return getSubjectCode(req.user) || String(req.user?.username || req.user?.id || '');
}

async function listVerifiersController(req, res) {
  try {
    const records = await verifierService.listVerifications({ q: req.query?.q });
    return res.json({ records });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listVerifiers error:', error);
    return res.status(500).json({ message: 'Failed to list verifier records.' });
  }
}

async function submitVerifierController(req, res) {
  const { vendorId } = req.params || {};
  if (!vendorId) return res.status(400).json({ message: 'vendorId is required.' });
  try {
    const record = await verifierService.submitVerification(vendorId, actorCode(req));
    return res.json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('not found') ? 404 : 400;
    return res.status(status).json({ message: msg || 'Failed to submit verification.' });
  }
}

async function reviewVerifierController(req, res) {
  const { vendorId } = req.params || {};
  if (!vendorId) return res.status(400).json({ message: 'vendorId is required.' });
  if (!(await userCanReview(req))) {
    return res.status(403).json({ message: 'Cheker access required (Admin or Admin Personnel).' });
  }
  try {
    const record = await verifierService.reviewVerification(
      vendorId,
      req.body || {},
      actorCode(req),
    );
    return res.json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('not found') ? 404 : 400;
    return res.status(status).json({ message: msg || 'Failed to review verification.' });
  }
}

module.exports = {
  listVerifiersController,
  submitVerifierController,
  reviewVerifierController,
};
