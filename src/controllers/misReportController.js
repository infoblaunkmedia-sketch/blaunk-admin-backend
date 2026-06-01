const misReportService = require('../services/misReportService');

async function exportMisReportController(req, res) {
  const {
    department,
    reportType,
    fromDate,
    toDate,
    uploadSource,
    extraFilter,
  } = req.body || {};

  if (!department || !reportType || !fromDate || !toDate) {
    return res.status(400).json({
      message: 'department, reportType, fromDate, and toDate are required.',
    });
  }

  try {
    const rows = await misReportService.exportMisRows({
      department,
      reportType,
      fromDate,
      toDate,
      uploadSource: uploadSource || 'all',
      q: extraFilter,
    });

    return res.json({ rows });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('required') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to export MIS report.' });
  }
}

module.exports = {
  exportMisReportController,
};
