const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { optionalAuthMiddleware } = require('../middleware/optionalAuthMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  getPublicContestQuizController,
  getAdminContestQuizController,
  upsertContestQuizController,
  deleteContestQuizController,
  listContestSubmissionsController,
  submitContestAnswerController,
} = require('../controllers/contestQuizController');

const router = express.Router();

router.get('/public', getPublicContestQuizController);
router.post('/public/submit', optionalAuthMiddleware, submitContestAnswerController);

const adminGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('adminPersonnel', 'media'),
];

router.get('/', adminGuard, getAdminContestQuizController);
router.put('/', adminGuard, upsertContestQuizController);
router.delete('/', adminGuard, deleteContestQuizController);
router.get('/submissions', adminGuard, listContestSubmissionsController);

module.exports = router;
