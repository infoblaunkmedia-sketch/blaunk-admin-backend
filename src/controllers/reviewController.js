const reviewService = require('../services/reviewService');

async function listReviewsController(req, res) {
  try {
    const records = await reviewService.listReviews(req.query || {});
    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to list reviews.' });
  }
}

async function getReviewController(req, res) {
  try {
    const record = await reviewService.getReviewById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Review not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load review.' });
  }
}

async function patchReviewController(req, res) {
  try {
    const record = await reviewService.patchReviewStatus(req.params.id, req.body?.status);
    if (!record) return res.status(404).json({ message: 'Review not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Failed to update review.' });
  }
}

async function deleteReviewController(req, res) {
  try {
    const deleted = await reviewService.deleteReviewById(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Review not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete review.' });
  }
}

module.exports = {
  listReviewsController,
  getReviewController,
  patchReviewController,
  deleteReviewController,
};
