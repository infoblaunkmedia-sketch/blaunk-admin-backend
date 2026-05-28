const mongoose = require('mongoose');
const sellerService = require('../services/sellerService');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ''));
}

async function listSellersController(req, res) {
  const { q, status, page, limit } = req.query || {};
  try {
    const result = await sellerService.listSellers({ q, status, page, limit });
    return res.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listSellers error:', error);
    return res.status(500).json({ message: 'Failed to list sellers.' });
  }
}

async function getSellerController(req, res) {
  const { id } = req.params || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid seller id.' });
  try {
    const record = await sellerService.getSellerById(id);
    if (!record) return res.status(404).json({ message: 'Seller not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load seller.' });
  }
}

async function getSellerDocumentsController(req, res) {
  const { id } = req.params || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid seller id.' });
  try {
    const result = await sellerService.getSellerDocuments(id);
    if (!result) return res.status(404).json({ message: 'Seller not found.' });
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load documents.' });
  }
}

async function approveSellerController(req, res) {
  const { id } = req.params || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid seller id.' });
  try {
    const result = await sellerService.approveSeller(id, req.user?.username || req.user?.id);
    if (!result) return res.status(404).json({ message: 'Seller not found.' });
    return res.json(result);
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('already') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to approve seller.' });
  }
}

async function rejectSellerController(req, res) {
  const { id } = req.params || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid seller id.' });
  const reason = req.body?.reason || req.body?.rejectionReason;
  try {
    const result = await sellerService.rejectSeller(id, reason, req.user?.username || req.user?.id);
    if (!result) return res.status(404).json({ message: 'Seller not found.' });
    return res.json(result);
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('required') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to reject seller.' });
  }
}

async function saveSellerController(req, res) {
  const id = req.params?.id || req.body?.id;
  try {
    const record = await sellerService.saveSeller({ ...req.body, id });
    return res.status(id ? 200 : 201).json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('required') || msg.includes('exists') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to save seller.' });
  }
}

async function deleteSellerController(req, res) {
  const { id } = req.params || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid seller id.' });
  try {
    const ok = await sellerService.deleteSellerById(id);
    if (!ok) return res.status(404).json({ message: 'Seller not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete seller.' });
  }
}

async function nextVendorCodeController(req, res) {
  try {
    const code = await sellerService.nextVendorCode();
    return res.json({ code });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate vendor code.' });
  }
}

module.exports = {
  listSellersController,
  getSellerController,
  getSellerDocumentsController,
  approveSellerController,
  rejectSellerController,
  saveSellerController,
  deleteSellerController,
  nextVendorCodeController,
};
