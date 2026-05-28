const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const {
  listSellersController,
  getSellerController,
  getSellerDocumentsController,
  approveSellerController,
  rejectSellerController,
  saveSellerController,
  deleteSellerController,
  nextVendorCodeController,
} = require('../controllers/sellerController');

const router = express.Router();

const vendorGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('customers', 'vendors'),
];

router.get('/next-code', vendorGuard, nextVendorCodeController);
router.get('/', vendorGuard, listSellersController);
router.post('/', vendorGuard, saveSellerController);
router.get('/:id/documents', vendorGuard, getSellerDocumentsController);
router.post('/:id/approve', vendorGuard, approveSellerController);
router.post('/:id/reject', vendorGuard, rejectSellerController);
router.get('/:id', vendorGuard, getSellerController);
router.patch('/:id', vendorGuard, saveSellerController);
router.delete('/:id', vendorGuard, deleteSellerController);

module.exports = router;
