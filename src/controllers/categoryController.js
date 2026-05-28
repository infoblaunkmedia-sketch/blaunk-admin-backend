const mongoose = require('mongoose');
const categoryService = require('../services/categoryService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listCategoriesController(req, res) {
  try {
    const tree = await categoryService.listCategoriesTree();
    return res.json({ categories: tree });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list categories.' });
  }
}

async function listPublicCategoriesController(req, res) {
  try {
    const tree = await categoryService.listPublicCategories();
    return res.json({ categories: tree });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list categories.' });
  }
}

async function createCategoryController(req, res) {
  try {
    const record = await categoryService.createCategory(req.body);
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to create category.' });
  }
}

async function patchCategoryController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await categoryService.updateCategory(req.params.id, req.body);
    if (!record) return res.status(404).json({ message: 'Category not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update category.' });
  }
}

async function deleteCategoryController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    await categoryService.deleteCategory(req.params.id);
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to delete category.' });
  }
}

module.exports = {
  listCategoriesController,
  listPublicCategoriesController,
  createCategoryController,
  patchCategoryController,
  deleteCategoryController,
};
