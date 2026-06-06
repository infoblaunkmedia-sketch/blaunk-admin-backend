const express = require('express');
const { slotContentController } = require('../controllers/publicSlotController');

const router = express.Router();

router.get('/slot-content', slotContentController);

module.exports = router;
