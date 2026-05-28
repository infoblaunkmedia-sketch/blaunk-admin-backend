const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/authMiddleware');
const { requireRole, ROLES, requireAdmin } = require('../middleware/requireRole');
const { requireSection } = require('../middleware/requirePermission');
const sellerService = require('../services/sellerService');
const cloudinaryService = require('../services/cloudinaryService');
const siteMediaService = require('../services/siteMediaService');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024,
  },
});

const kycStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename(req, file, cb) {
    const sellerId = String(req.body?.sellerId || 'unknown').replace(/[^a-zA-Z0-9]/g, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `kyc-${sellerId}-${uniqueSuffix}${ext}`);
  },
});

const uploadKyc = multer({
  storage: kycStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const cloudinaryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
});

const uploadGuard = [authMiddleware, requireRole(ROLES.ADMIN, ROLES.EMP, ROLES.THREE_P)];

const adminPersonnelMediaGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('adminPersonnel', 'media'),
];

const cmsBannerUploadGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'banners'),
];

const cmsGiffUploadGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'giff'),
];

const cmsShopUploadGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('cms', 'local-stores'),
];

const bannerUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const giffUpload = multer({
  storage,
  limits: { fileSize: 700 * 1024 },
});

function normalizeUploadSection(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
}

function normalizeUploadSlot(raw) {
  const n = Number(String(raw || '').replace(/[^0-9]/g, ''));
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.floor(n);
}

const kycUploadGuard = [
  authMiddleware,
  requireRole(ROLES.ADMIN, ROLES.EMP),
  requireSection('customers', 'vendors'),
];

router.post(
  '/employee-document',
  uploadGuard,
  upload.single('document'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    return res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    });
  },
);

router.post(
  '/kyc-document',
  kycUploadGuard,
  uploadKyc.single('document'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const sellerId = String(req.body?.sellerId || '').trim();
    if (!sellerId) {
      return res.status(400).json({ message: 'sellerId is required.' });
    }
    try {
      const document = await sellerService.addKycDocument(sellerId, {
        docType: req.body?.docType,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        uploadedBy: req.user?.username || req.user?.id || '',
      });
      if (!document) {
        return res.status(404).json({ message: 'Seller not found.' });
      }
      return res.status(201).json({
        message: 'KYC document uploaded',
        document,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
      });
    } catch (error) {
      const msg = String(error?.message || '');
      return res.status(500).json({ message: msg || 'Failed to attach KYC document.' });
    }
  },
);

router.post(
  '/shop',
  cmsShopUploadGuard,
  bannerUpload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Please select an image file.' });
    }
    return res.json({
      message: 'Shop image uploaded',
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    });
  },
);

router.post(
  '/giff',
  cmsGiffUploadGuard,
  giffUpload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Please select an image file.' });
    }
    return res.json({
      message: 'GIFF image uploaded',
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    });
  },
);

router.post(
  '/banner',
  cmsBannerUploadGuard,
  bannerUpload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Please select an image file.' });
    }
    return res.json({
      message: 'Banner image uploaded',
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    });
  },
);

router.post(
  '/image',
  uploadGuard,
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    return res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`,
    });
  },
);

router.post(
  '/testimonial-photo',
  cmsBannerUploadGuard,
  cloudinaryUpload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Please select an image file.' });
    }
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ message: 'Cloudinary is not configured on the server.' });
    }
    const folderBase = process.env.CLOUDINARY_PROJECT_FOLDER || 'bluank';
    const folder = `${folderBase}/testimonials`;
    try {
      const result = await cloudinaryService.uploadImageBuffer(req.file.buffer, {
        folder,
        publicId: `profile-${Date.now()}`,
      });
      return res.json({
        message: 'Image uploaded successfully',
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      const msg = String(error?.message || 'Cloudinary upload failed.');
      return res.status(500).json({ message: msg });
    }
  },
);

router.post(
  '/cloudinary',
  adminPersonnelMediaGuard,
  cloudinaryUpload.single('image'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!req.file.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Please select an image file.' });
    }
    if (!cloudinaryService.isConfigured()) {
      return res.status(503).json({ message: 'Cloudinary is not configured on the server.' });
    }
    const section = normalizeUploadSection(req.body?.section);
    const slotNum = normalizeUploadSlot(req.body?.slot);
    const folderBase = process.env.CLOUDINARY_PROJECT_FOLDER || 'bluank';
    const folder = `${folderBase}/admin-personnel/${section || 'media'}`;
    try {
      const result = await cloudinaryService.uploadImageBuffer(req.file.buffer, {
        folder,
        publicId: `slot-${slotNum || '0'}-${Date.now()}`,
      });
      if (section && slotNum) {
        await siteMediaService.upsertSlot({
          section,
          slot: slotNum,
          kind: 'image',
          value: result.secure_url,
          fileName: req.file.originalname || '',
          title: String(req.body?.title || '').trim(),
        });
      }
      return res.json({
        message: 'Image uploaded successfully',
        url: result.secure_url,
        publicId: result.public_id,
        section,
        slot: slotNum,
      });
    } catch (error) {
      const msg = String(error?.message || 'Cloudinary upload failed.');
      return res.status(500).json({ message: msg });
    }
  },
);

router.use((err, req, res, next) => {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const isCloudinary = String(req.path || '').includes('cloudinary');
      return res.status(413).json({
        message: isCloudinary
          ? 'This file is too large. Maximum upload size is 1 MB.'
          : 'This file is too large. Maximum upload size is 200 KB.',
      });
    }
    return res.status(400).json({ message: err.message || 'Upload failed.' });
  }
  return res.status(500).json({ message: 'Upload failed.' });
});

module.exports = router;
