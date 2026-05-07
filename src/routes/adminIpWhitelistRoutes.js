const express = require('express');
const {
  addIpController,
  patchIpController,
  getIpListController,
  deleteIpController,
} = require('../controllers/adminIpWhitelistController');

const router = express.Router();

router.post('/add-ip', addIpController);
router.patch('/ip/:id', patchIpController);
router.get('/ip-list', getIpListController);
router.delete('/delete-ip/:id', deleteIpController);

module.exports = router;
