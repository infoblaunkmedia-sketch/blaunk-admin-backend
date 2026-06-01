const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireModule } = require('../middleware/requirePermission');
const { exportMisReportController } = require('../controllers/misReportController');

const router = express.Router();

const reportsGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireModule('reports'),
];

router.post('/mis-export', reportsGuard, exportMisReportController);

module.exports = router;
