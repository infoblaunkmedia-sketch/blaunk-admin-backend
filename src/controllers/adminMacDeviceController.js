const macAddressConfigService = require('../services/macAddressConfigService');

async function getMacDevicesController(req, res) {
  const { linkedType, linkedCode } = req.query || {};
  try {
    const list = await macAddressConfigService.getItDevices({ linkedType, linkedCode });
    return res.json({ list });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getMacDevices error:', err);
    return res.status(500).json({ message: 'Failed to load MAC devices.' });
  }
}

async function addMacDeviceController(req, res) {
  const body = req.body || {};
  try {
    const row = await macAddressConfigService.createItDevice({
      ...body,
      addedBy: body.addedBy || req.user?.employeeCode || req.user?.username || '',
      approvedBy: body.approvedBy || req.user?.employeeCode || req.user?.username || '',
    });
    return res.status(201).json({ success: true, row });
  } catch (err) {
    const status = err.statusCode || 500;
    const message = err.statusCode ? err.message : 'Failed to add MAC device.';
    return res.status(status).json({ message });
  }
}

async function patchMacDeviceController(req, res) {
  const { id } = req.params;
  try {
    const row = await macAddressConfigService.updateItDevice(id, req.body || {});
    if (!row) return res.status(404).json({ message: 'MAC device not found.' });
    return res.json({ success: true, row });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('patchMacDevice error:', err);
    return res.status(500).json({ message: 'Failed to update MAC device.' });
  }
}

async function deleteMacDeviceController(req, res) {
  const { id } = req.params;
  try {
    const deleted = await macAddressConfigService.deleteItDevice(id);
    if (!deleted) return res.status(404).json({ message: 'MAC device not found.' });
    return res.json({ success: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('deleteMacDevice error:', err);
    return res.status(500).json({ message: 'Failed to delete MAC device.' });
  }
}

module.exports = {
  getMacDevicesController,
  addMacDeviceController,
  patchMacDeviceController,
  deleteMacDeviceController,
};
