const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listVacanciesController,
  listPublicVacanciesController,
  getVacancyController,
  saveVacancyController,
  deleteVacancyController,
} = require('../controllers/vacancyController');

const router = express.Router();

router.get('/public', listPublicVacanciesController);

const vacancyRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('people', 'vacancies'),
];

const vacancyWrite = [...vacancyRead];
const vacancyDelete = [...vacancyRead];

router.get('/', vacancyRead, listVacanciesController);
router.post('/', vacancyWrite, saveVacancyController);
router.get('/:id', vacancyRead, getVacancyController);
router.patch('/:id', vacancyWrite, saveVacancyController);
router.delete('/:id', vacancyDelete, deleteVacancyController);

module.exports = router;
