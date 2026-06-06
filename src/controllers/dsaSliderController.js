const dsaSliderService = require('../services/dsaSliderService');
const dsaService = require('../services/dsaService');
const {
  isAdminUser,
  is3pUser,
  getSubjectCode,
} = require('../middleware/requireRole');

function isAllowedManager(req) {
  return isAdminUser(req.user) || is3pUser(req.user);
}

function ownDsaCode(req) {
  return getSubjectCode(req.user);
}

function sliderOwnedByUser(req, record) {
  if (!record || isAdminUser(req.user)) return true;
  if (!is3pUser(req.user)) return true;
  return String(record.dsaCode || '').toUpperCase() === ownDsaCode(req);
}

async function assertAdminPanelDsaAccess(req, res) {
  if (!is3pUser(req.user)) return true;
  const code = ownDsaCode(req);
  if (!code) {
    res.status(403).json({ message: 'DSA code is not configured for this account.' });
    return false;
  }
  const allowed = await dsaService.isAdminPanelDsa(code);
  if (!allowed) {
    res.status(403).json({ message: 'Website DSA cannot access admin panel.' });
    return false;
  }
  return true;
}

async function listSlidersController(req, res) {
  const { mediaTab, section, country, status, q, limit, cmsPage, cmsPosition } = req.query || {};
  try {
    if (!(await assertAdminPanelDsaAccess(req, res))) return;
    const dsaCode = is3pUser(req.user) ? ownDsaCode(req) : req.query?.dsaCode;
    const records = await dsaSliderService.listSliders({
      mediaTab,
      section,
      country,
      cmsPage,
      cmsPosition,
      status,
      q,
      dsaCode,
      limit,
      adminPanelOnly: !is3pUser(req.user),
    });
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
    if (!sliderOwnedByUser(req, record)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
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
    if (!(await assertAdminPanelDsaAccess(req, res))) return;
    const body = { ...(req.body || {}) };
    if (is3pUser(req.user)) {
      const empCode = ownDsaCode(req);
      body.dsaCode = empCode;
      body.uploadSource = 'admin_3p';
      body.uploadedByDsaCode = empCode;
    } else if (String(body.uploadSource || '').toLowerCase() === 'vendor_direct') {
      body.uploadSource = 'vendor_direct';
      body.uploadedByDsaCode = null;
    } else {
      body.uploadSource = body.uploadSource || 'admin_3p';
      if (isAdminUser(req.user)) {
        body.bypassAdminPanelDsaCheck = true;
      }
    }
    const record = await dsaSliderService.createSlider(body);
    return res.status(201).json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const low = msg.toLowerCase();
    let status = 500;
    if (error?.statusCode === 403 || low.includes('upload limit reached')) status = 403;
    else if (low.includes('required') || low.includes('invalid') || low.includes('slots are full')) status = 400;
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
    const existing = await dsaSliderService.getSliderById(id);
    if (!existing) return res.status(404).json({ message: 'Slider not found.' });
    if (!sliderOwnedByUser(req, existing)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const body = { ...(req.body || {}) };
    if (is3pUser(req.user)) {
      body.dsaCode = ownDsaCode(req);
    } else if (isAdminUser(req.user)) {
      body.bypassAdminPanelDsaCheck = true;
    }
    const record = await dsaSliderService.updateSlider(id, body);
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
  const { mediaTab, section, country, cmsPage, cmsPosition } = req.query || {};
  try {
    const status = await dsaSliderService.getSlotStatus({
      mediaTab,
      section,
      country,
      cmsPage,
      cmsPosition,
    });
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
    const existing = await dsaSliderService.getSliderById(id);
    if (!existing) return res.status(404).json({ message: 'Slider not found.' });
    if (!sliderOwnedByUser(req, existing)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
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
  const { mediaTab, section, country, cmsPage, cmsPosition } = req.query || {};
  try {
    const records = await dsaSliderService.listActiveBySlot({
      mediaTab,
      section,
      country,
      cmsPage,
      cmsPosition,
    });
    return res.json({ records });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('invalid') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to fetch sliders.' });
  }
}

async function sliderSummaryController(req, res) {
  const { mediaTab, section, country, cmsPage, cmsPosition } = req.query || {};
  const dsaCode = is3pUser(req.user) ? ownDsaCode(req) : req.query?.dsaCode;
  try {
    const summary = await dsaSliderService.getSummary({
      mediaTab,
      section,
      country,
      cmsPage,
      cmsPosition,
      dsaCode,
    });
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
