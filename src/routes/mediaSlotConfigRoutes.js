const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { listConfigsController, saveConfigsController } = require('../controllers/mediaSlotConfigController');

const router = express.Router();

router.get('/', authMiddleware, listConfigsController);
router.put('/', authMiddleware, saveConfigsController);

module.exports = router;
