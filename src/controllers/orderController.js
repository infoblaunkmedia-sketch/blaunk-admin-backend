const mongoose = require('mongoose');
const orderService = require('../services/orderService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listOrdersController(req, res) {
  try {
    const result = await orderService.listOrders(req.query);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list orders.' });
  }
}

async function getOrderController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await orderService.getOrderById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load order.' });
  }
}

async function patchOrderStatusController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await orderService.updateOrderStatus(req.params.id, req.body);
    if (!record) return res.status(404).json({ message: 'Order not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update order.' });
  }
}

module.exports = { listOrdersController, getOrderController, patchOrderStatusController };
