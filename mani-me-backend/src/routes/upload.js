const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { verifyAdmin, verifyToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

// SECURITY: Allowed image MIME types and extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
  
  // Check file extension
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('Invalid file extension.'), false);
  }
  
  cb(null, true);
};

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// Error handler for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

const verifyDriverOrAdmin = (req, res, next) => {
  const role = String(req.user?.role || '').toUpperCase();
  if (role === 'UK_DRIVER' || role === 'GH_DRIVER' || role === 'ADMIN' || role === 'DRIVER') {
    return next();
  }
  return res.status(403).json({ message: 'Driver or admin access required' });
};

router.post('/image', verifyAdmin, uploadLimiter, upload.single('image'), handleUploadError, uploadController.uploadImage);
router.post('/image/driver', verifyToken, verifyDriverOrAdmin, uploadLimiter, upload.single('image'), handleUploadError, uploadController.uploadImage);
router.delete('/image', verifyAdmin, uploadController.deleteImage);

module.exports = router;
