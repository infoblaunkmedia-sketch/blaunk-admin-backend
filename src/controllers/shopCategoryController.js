const mongoose = require('mongoose');
const shopCategoryService = require('../services/shopCategoryService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listPublicCategoriesController(req, res) {
  try {
    const records = await shopCategoryService.listPublicCategories();
    return res.json({ records });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to list categories.' });
  }
}

async function listCategoriesController(req, res) {
  try {
    const records = await shopCategoryService.listCategories();
    return res.json({ records });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to list categories.' });
  }
}

async function createCategoryController(req, res) {
  try {
    const record = await shopCategoryService.createCategory(req.body || {});
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to create category.' });
  }
}

async function updateCategoryController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await shopCategoryService.updateCategory(req.params.id, req.body || {});
    if (!record) return res.status(404).json({ message: 'Category not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update category.' });
  }
}

async function deleteCategoryController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    await shopCategoryService.deleteCategory(req.params.id);
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to delete category.' });
  }
}

module.exports = {
  listPublicCategoriesController,
  listCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
};
