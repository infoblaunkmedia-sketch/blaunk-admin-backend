const ipWhitelistService = require('../services/ipWhitelistService');

/**
 * POST /admin/add-ip
 * Body: { service_provider?, ip_address: string, active?: boolean, added_by?: string }
 */
async function addIpController(req, res) {
  const {
    service_provider: serviceProvider,
    ip_address: ipAddress,
    active,
    added_by: addedBy,
  } = req.body || {};
  try {
    const row = await ipWhitelistService.addAllowedIp(serviceProvider, ipAddress, {
      active: typeof active === 'boolean' ? active : undefined,
      addedBy,
    });
    return res.status(201).json({ success: true, row });
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      err.statusCode === 400 ? err.message : 'Failed to add IP.';
    return res.status(status).json({ message });
  }
}

/**
 * PATCH /admin/ip/:id
 * Body: { active?: boolean, service_provider?: string, ip_address?: string }
 */
async function patchIpController(req, res) {
  const { id } = req.params;
  const { active, service_provider: serviceProvider, ip_address: ipAddress } =
    req.body || {};
  try {
    const row = await ipWhitelistService.updateAllowedIp(id, {
      ...(active !== undefined ? { active: !!active } : {}),
      ...(serviceProvider !== undefined ? { serviceProvider } : {}),
      ...(ipAddress !== undefined ? { ipAddress } : {}),
    });
    return res.json({ success: true, row });
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      err.statusCode === 400 || err.statusCode === 404
        ? err.message
        : 'Failed to update IP.';
    return res.status(status).json({ message });
  }
}

/**
 * GET /admin/ip-list
 */
async function getIpListController(req, res) {
  try {
    const list = await ipWhitelistService.getAllowedIps();
    return res.json({ list });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getIpList error:', err);
    return res.status(500).json({ message: 'Failed to load IP list.' });
  }
}

/**
 * DELETE /admin/delete-ip/:id
 */
async function deleteIpController(req, res) {
  const { id } = req.params;
  try {
    const deleted = await ipWhitelistService.deleteAllowedIp(id);
    if (!deleted) {
      return res.status(404).json({ message: 'IP entry not found.' });
    }
    return res.json({ success: true });
  } catch (err) {
    const status = err.statusCode || 500;
    const message =
      err.statusCode === 400 ? err.message : 'Failed to delete IP.';
    return res.status(status).json({ message });
  }
}

module.exports = {
  addIpController,
  patchIpController,
  getIpListController,
  deleteIpController,
};
