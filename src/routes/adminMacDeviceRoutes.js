const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getMacDevicesController,
  addMacDeviceController,
  patchMacDeviceController,
  deleteMacDeviceController,
} = require('../controllers/adminMacDeviceController');

const router = express.Router();

router.use(authMiddleware);

router.get('/mac-devices', getMacDevicesController);
router.post('/add-mac-device', addMacDeviceController);
router.patch('/mac-device/:id', patchMacDeviceController);
router.delete('/delete-mac-device/:id', deleteMacDeviceController);

module.exports = router;
