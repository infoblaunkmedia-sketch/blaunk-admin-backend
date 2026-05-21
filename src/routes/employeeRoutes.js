const express = require('express');
const { listEmployeeCodesController, nextEmployeeCodeController } = require('../controllers/employeeController');

const router = express.Router();

router.get('/codes', listEmployeeCodesController);
router.get('/next-code', nextEmployeeCodeController);

module.exports = router;

