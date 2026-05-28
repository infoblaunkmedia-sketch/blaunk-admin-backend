const siteMediaService = require('../services/siteMediaService');

async function listSiteMediaController(req, res) {
  try {
    const records = await siteMediaService.listAssets({
      section: req.query?.section,
    });
    return res.json({ records });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to load media.' });
  }
}

async function listPublicSiteMediaController(req, res) {
  try {
    const records = await siteMediaService.listPublicAssets({
      section: req.query?.section,
    });
    const bySection = siteMediaService.groupBySection(records);
    return res.json({
      records,
      bySection,
      sectionLayout: siteMediaService.buildSectionLayout(bySection),
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to load media.' });
  }
}

async function upsertSiteMediaSlotController(req, res) {
  try {
    const record = await siteMediaService.upsertSlot(req.body || {});
    return res.json({ record });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to save media.' });
  }
}

async function clearSiteMediaSlotController(req, res) {
  try {
    const result = await siteMediaService.clearSlot(req.body || {});
    return res.json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to clear media.' });
  }
}

module.exports = {
  listSiteMediaController,
  listPublicSiteMediaController,
  upsertSiteMediaSlotController,
  clearSiteMediaSlotController,
};
