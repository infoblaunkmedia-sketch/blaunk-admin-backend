const mongoose = require('mongoose');
const giffService = require('../services/giffService');
const { GIFF_CATEGORIES } = require('../constants/giffCategories');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listCategoriesController(_req, res) {
  return res.json({ categories: GIFF_CATEGORIES });
}

async function listGiffsController(req, res) {
  try {
    const result = await giffService.listGiffs(req.query);
    return res.json(result);
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to list GIFF records.' });
  }
}

async function listPublicGiffsController(req, res) {
  try {
    const result = await giffService.listPublicGiffs(req.query);
    return res.json(result);
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to list GIFF records.' });
  }
}

async function createGiffController(req, res) {
  try {
    const record = await giffService.createGiff(req.body);
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to create GIFF record.' });
  }
}

async function updateGiffHandler(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await giffService.updateGiff(req.params.id, req.body);
    if (!record) return res.status(404).json({ message: 'GIFF record not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update GIFF record.' });
  }
}

async function deleteGiffController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    await giffService.deleteGiff(req.params.id);
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to delete GIFF record.' });
  }
}

module.exports = {
  listCategoriesController,
  listGiffsController,
  listPublicGiffsController,
  createGiffController,
  putGiffController: updateGiffHandler,
  patchGiffController: updateGiffHandler,
  deleteGiffController,
};
