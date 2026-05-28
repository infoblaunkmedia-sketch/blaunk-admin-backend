const mongoose = require('mongoose');
const shopService = require('../services/shopService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listPublicShopsController(req, res) {
  try {
    const records = await shopService.listPublicShops(req.query);
    return res.json(records);
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to list shops.' });
  }
}

async function registerShopController(req, res) {
  try {
    const record = await shopService.registerShop(req.body || {});
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Registration failed.' });
  }
}

async function listShopsController(req, res) {
  try {
    const records = await shopService.listShops(req.query);
    return res.json({ records });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to list shops.' });
  }
}

async function updateShopController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await shopService.updateShop(req.params.id, req.body || {});
    if (!record) return res.status(404).json({ message: 'Shop not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update shop.' });
  }
}

async function deleteShopController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    await shopService.deleteShop(req.params.id);
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to delete shop.' });
  }
}

module.exports = {
  listPublicShopsController,
  registerShopController,
  listShopsController,
  updateShopController,
  deleteShopController,
};
