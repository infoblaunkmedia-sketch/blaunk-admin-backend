const ThirdPartyCredential = require('../models/ThirdPartyCredential');
const matchCodeService = require('../services/matchCodeService');
const { is3pUser, getSubjectCode } = require('./requireRole');

const FORBIDDEN_MSG = 'Invalid or missing match code';

/**
 * For 3P employees only: require a valid match code on their credential before upload.
 * Admin and regular employees skip this check.
 */
async function require3pMatchCodeForUpload(req, res, next) {
  if (!req.user || !is3pUser(req.user)) {
    return next();
  }

  try {
    const empCode = getSubjectCode(req.user);
    if (!empCode) {
      return res.status(403).json({ message: FORBIDDEN_MSG });
    }

    const credential = await ThirdPartyCredential.findOne({ threePEmplCode: empCode })
      .select('matchCode threePEmplCode')
      .lean();

    const matchCode = String(credential?.matchCode || '').trim();
    if (!matchCode) {
      return res.status(403).json({ message: FORBIDDEN_MSG });
    }

    const valid = await matchCodeService.validateCode(matchCode, empCode);
    if (!valid) {
      return res.status(403).json({ message: FORBIDDEN_MSG });
    }

    req.upload3pMeta = {
      empCode: String(credential?.threePEmplCode || empCode).trim().toUpperCase(),
      matchCode,
    };
    return next();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('require3pMatchCodeForUpload error:', error);
    return res.status(500).json({ message: 'Failed to validate match code.' });
  }
}

function withUpload3pMeta(req, payload) {
  if (!req.upload3pMeta) return payload;
  return {
    ...payload,
    empCode: req.upload3pMeta.empCode,
    matchCode: req.upload3pMeta.matchCode,
  };
}

module.exports = {
  require3pMatchCodeForUpload,
  withUpload3pMeta,
};
