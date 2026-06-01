const vacancyService = require('../services/vacancyService');

async function listVacanciesController(req, res) {
  try {
    const records = await vacancyService.listVacancies(req.query || {});
    return res.json({ records });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to list vacancies.' });
  }
}

async function getVacancyController(req, res) {
  try {
    const record = await vacancyService.getVacancyById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Vacancy not found.' });
    return res.json({ record });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load vacancy.' });
  }
}

async function saveVacancyController(req, res) {
  try {
    const payload = { ...(req.body || {}), ...(req.params.id ? { id: req.params.id } : {}) };
    const record = await vacancyService.saveVacancy(payload);
    return res.status(200).json({ record });
  } catch (error) {
    const status = String(error?.message || '').toLowerCase().includes('required') ? 400 : 500;
    return res.status(status).json({ message: error.message || 'Failed to save vacancy.' });
  }
}

async function deleteVacancyController(req, res) {
  try {
    const deleted = await vacancyService.deleteVacancyById(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Vacancy not found.' });
    return res.json({ deleted: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete vacancy.' });
  }
}

module.exports = {
  listVacanciesController,
  getVacancyController,
  saveVacancyController,
  deleteVacancyController,
};
