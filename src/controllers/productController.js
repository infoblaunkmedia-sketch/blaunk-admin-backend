const mongoose = require('mongoose');
const productService = require('../services/productService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listProductsController(req, res) {
  try {
    const result = await productService.listProducts(req.query);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list products.' });
  }
}

async function listPublicProductsController(req, res) {
  try {
    const records = await productService.listPublicProducts(req.query);
    return res.json({ records });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list products.' });
  }
}

async function createProductController(req, res) {
  try {
    const record = await productService.createProduct(req.body);
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to create product.' });
  }
}

async function patchProductStatusController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await productService.updateProductStatus(req.params.id, {
      status: req.body?.status,
      rejectionReason: req.body?.rejectionReason,
      approvedBy: req.user?.username || 'admin',
    });
    if (!record) return res.status(404).json({ message: 'Product not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update status.' });
  }
}

module.exports = { listProductsController, listPublicProductsController, createProductController, patchProductStatusController };
