const mongoose = require('mongoose');
const individualCustomerService = require('../services/individualCustomerService');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(String(id || ''));
}

async function listIndividualsController(req, res) {
  const { q, status, page, limit } = req.query || {};
  try {
    const result = await individualCustomerService.listIndividuals({ q, status, page, limit });
    return res.json(result);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('listIndividuals error:', error);
    return res.status(500).json({ message: 'Failed to list customers.' });
  }
}

async function getIndividualController(req, res) {
  const { id } = req.params || {};
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid customer id.' });
  }
  try {
    const record = await individualCustomerService.getIndividualById(id);
    if (!record) return res.status(404).json({ message: 'Customer not found.' });
    return res.json({ record });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getIndividual error:', error);
    return res.status(500).json({ message: 'Failed to load customer.' });
  }
}

async function patchIndividualStatusController(req, res) {
  const { id } = req.params || {};
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid customer id.' });
  }
  const { accountStatus, internalNotes } = req.body || {};
  if (accountStatus == null && internalNotes === undefined) {
    return res.status(400).json({ message: 'accountStatus or internalNotes is required.' });
  }
  try {
    const record = await individualCustomerService.updateIndividualStatus(id, {
      accountStatus,
      internalNotes,
    });
    if (!record) return res.status(404).json({ message: 'Customer not found.' });
    return res.json({ record });
  } catch (error) {
    const msg = String(error?.message || '');
    const status = msg.toLowerCase().includes('must') ? 400 : 500;
    return res.status(status).json({ message: msg || 'Failed to update customer.' });
  }
}

module.exports = {
  listIndividualsController,
  getIndividualController,
  patchIndividualStatusController,
};
