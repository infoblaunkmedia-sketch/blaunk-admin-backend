const dsaSliderService = require('../services/dsaSliderService');

function actorFromReq(req) {
  return String(req.user?.username || req.user?.id || 'system');
}

function isAllowedManager(req) {
  const role = String(req.user?.role || '').toLowerCase();
  if (role === 'admin') return true;
  const type = String(req.user?.employeeType || '').toLowerCase();
  return type === '3pc';
}

async function listSlidersController(req, res) {
  const { mediaTab, section, country, status, q, limit } = req.query || {};
  try {
    const records = await dsaSliderService.listSliders({ mediaTab, section, country, status, q, limit });
    return res.json({ records });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listSliders error:', error);
    return res.status(500).json({ message: 'Failed to list sliders.' });
  }
}

async function getSliderController(req, res) {
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  try {
    const record = await dsaSliderService.getSliderById(id);
    if (!record) return res.status(404).json({ message: 'Slider not found.' });
    return res.json({ record });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getSlider error:', error);
    return res.status(500).json({ message: 'Failed to load slider.' });
  }
}

async function createSliderController(req, res) {
  if (!isAllowedManager(req)) {
    return res.status(403).json({ message: 'Only admin/3P users can manage sliders.' });
  }
  try {
    const body = { ...(req.body || {}) };
    if (String(req.user?.employeeType || '').toLowerCase() === '3pc' && !body.dsaCode) {
      body.dsaCode = String(req.user?.employeeCode || req.user?.username || '').trim();
    }
    const record = await dsaSliderService.createSlider(body, actorFromReq(req));
    return res.status(201).json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const low = msg.toLowerCase();
    const status =
      low.includes('required') || low.includes('invalid') || low.includes('slots are full') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to create slider.' });
  }
}

async function updateSliderController(req, res) {
  if (!isAllowedManager(req)) {
    return res.status(403).json({ message: 'Only admin/3P users can manage sliders.' });
  }
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  try {
    const body = { ...(req.body || {}) };
    if (String(req.user?.employeeType || '').toLowerCase() === '3pc' && !body.dsaCode) {
      body.dsaCode = String(req.user?.employeeCode || req.user?.username || '').trim();
    }
    const record = await dsaSliderService.updateSlider(id, body, actorFromReq(req));
    if (!record) return res.status(404).json({ message: 'Slider not found.' });
    return res.json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const low = msg.toLowerCase();
    const status =
      low.includes('required') || low.includes('invalid') || low.includes('slots are full') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to update slider.' });
  }
}

async function slotStatusController(req, res) {
  const { mediaTab, section, country } = req.query || {};
  try {
    const status = await dsaSliderService.getSlotStatus({ mediaTab, section, country });
    return res.json({ status });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('slotStatus error:', error);
    return res.status(500).json({ message: 'Failed to load slot status.' });
  }
}

async function deleteSliderController(req, res) {
  if (!isAllowedManager(req)) {
    return res.status(403).json({ message: 'Only admin/3P users can manage sliders.' });
  }
  const { id } = req.params || {};
  if (!id) return res.status(400).json({ message: 'id is required.' });
  try {
    const deletedCount = await dsaSliderService.deleteSlider(id);
    if (!deletedCount) return res.status(404).json({ message: 'Slider not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('deleteSlider error:', error);
    return res.status(500).json({ message: 'Failed to delete slider.' });
  }
}

async function listPublicSlidersBySlotController(req, res) {
  const { mediaTab, section, country } = req.query || {};
  try {
    const records = await dsaSliderService.listActiveBySlot({ mediaTab, section, country });
    return res.json({ records });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('invalid') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to fetch sliders.' });
  }
}

async function sliderSummaryController(req, res) {
  const { mediaTab, section, country, dsaCode } = req.query || {};
  try {
    const summary = await dsaSliderService.getSummary({ mediaTab, section, country, dsaCode });
    return res.json({ summary });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch slider summary.' });
  }
}

module.exports = {
  listSlidersController,
  getSliderController,
  createSliderController,
  updateSliderController,
  deleteSliderController,
  listPublicSlidersBySlotController,
  sliderSummaryController,
  slotStatusController,
};

