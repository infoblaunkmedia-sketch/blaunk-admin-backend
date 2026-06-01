const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, requireAdmin, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listIssuesController,
  getIssueController,
  saveIssueController,
  patchIssueController,
  deleteIssueController,
} = require('../controllers/issueController');

const router = express.Router();

const issueRead = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('customers', 'issues'),
];

const issueWrite = [...issueRead];
const issueDelete = [authMiddleware, requireAdmin, requireSection('customers', 'issues')];

router.get('/', issueRead, listIssuesController);
router.post('/', issueWrite, saveIssueController);
router.get('/:id', issueRead, getIssueController);
router.patch('/:id', issueWrite, patchIssueController);
router.delete('/:id', issueDelete, deleteIssueController);

module.exports = router;
