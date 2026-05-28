const mongoose = require('mongoose');
const bannerService = require('../services/bannerService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listBannersController(req, res) {
  try {
    const result = await bannerService.listBanners(req.query);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list banners.' });
  }
}

async function listPublicBannersController(req, res) {
  try {
    const result = await bannerService.listPublicBanners(req.query);
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to list banners.' });
  }
}

async function createBannerController(req, res) {
  try {
    const record = await bannerService.createBanner(req.body);
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to create banner.' });
  }
}

async function patchBannerController(req, res) {
  return updateBannerHandler(req, res);
}

async function putBannerController(req, res) {
  return updateBannerHandler(req, res);
}

async function updateBannerHandler(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await bannerService.updateBanner(req.params.id, req.body);
    if (!record) return res.status(404).json({ message: 'Banner not found.' });
    return res.json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to update banner.' });
  }
}

async function deleteBannerController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    await bannerService.deleteBanner(req.params.id);
    return res.json({ deleted: true });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to delete banner.' });
  }
}

module.exports = {
  listBannersController,
  listPublicBannersController,
  createBannerController,
  patchBannerController,
  putBannerController,
  deleteBannerController,
};
