const analyticsService = require('../services/analyticsService');

async function summaryController(req, res) {
  try {
    const summary = await analyticsService.getSummary();
    return res.json({ summary });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load analytics summary.' });
  }
}

async function chartsController(req, res) {
  try {
    const charts = await analyticsService.getCharts(req.query?.range);
    return res.json({ charts });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load chart data.' });
  }
}

module.exports = { summaryController, chartsController };
