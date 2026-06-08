const mongoose = require('mongoose');
const countryService = require('../services/countryService');

const isId = (id) => mongoose.Types.ObjectId.isValid(String(id || ''));

async function listCountriesController(req, res) {
  try {
    const includeInactive = String(req.query.all || '') === '1';
    const records = await countryService.listCountries({ activeOnly: !includeInactive });
    return res.json({ records });
  } catch (e) {
    return res.status(500).json({ message: e.message || 'Failed to load countries.' });
  }
}

async function createCountryController(req, res) {
  try {
    const record = await countryService.createCountry(req.body || {});
    return res.status(201).json({ record });
  } catch (e) {
    return res.status(400).json({ message: e.message || 'Failed to create country.' });
  }
}

async function patchCountryController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    const record = await countryService.updateCountry(req.params.id, req.body || {});
    return res.json({ record });
  } catch (e) {
    const status = String(e.message || '').includes('not found') ? 404 : 400;
    return res.status(status).json({ message: e.message || 'Failed to update country.' });
  }
}

async function deleteCountryController(req, res) {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
  try {
    await countryService.deleteCountry(req.params.id);
    return res.json({ deleted: true });
  } catch (e) {
    const status = String(e.message || '').includes('not found') ? 404 : 400;
    return res.status(status).json({ message: e.message || 'Failed to delete country.' });
  }
}

module.exports = {
  listCountriesController,
  createCountryController,
  patchCountryController,
  deleteCountryController,
};
