const dsaLimitService = require('../services/dsaLimitService');
const { getSubjectCode, is3pUser } = require('../middleware/requireRole');

async function usageSummaryController(req, res) {
  const { dsaCode } = req.query || {};
  try {
    const rows = await dsaLimitService.getUsageSummary({ dsaCode });
    return res.json({ records: rows });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('dsa-limits usage error:', err);
    return res.status(500).json({ message: 'Failed to load DSA limit usage.' });
  }
}

async function uploadStatusController(req, res) {
  const dsaCode = req.query?.dsaCode || (is3pUser(req.user) ? getSubjectCode(req.user) : '');
  try {
    const status = await dsaLimitService.getUploadStatus(dsaCode);
    return res.json({ status });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('dsa-limits status error:', err);
    return res.status(500).json({ message: 'Failed to load DSA upload status.' });
  }
}

module.exports = {
  usageSummaryController,
  uploadStatusController,
};
