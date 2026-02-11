const express = require('express');
const router = express.Router();
const multer = require('multer');
const { admin } = require('../firebase');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set');
}

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Not authorized' });
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Upload image endpoint
router.post('/image', verifyAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const file = req.file;
    const timestamp = Date.now();
    const fileName = `products/${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
      // Get Firebase Storage bucket
      const bucket = admin.storage().bucket();
      
      // Create a file reference
      const fileRef = bucket.file(fileName);
      
      // Upload the file
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
        public: true, // Make the file publicly accessible
      });

      // Get the public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      res.json({
        success: true,
        url: publicUrl,
        fileName: fileName,
      });
    } catch (firebaseError) {
      console.error('Firebase Storage error:', firebaseError);
      
      // Fallback: If Firebase Storage not configured, return a placeholder or use local storage
      // For now, return error but allow system to work with URL input
      return res.status(500).json({ 
        message: 'Firebase Storage not configured. Please use image URL instead.',
        error: firebaseError.message,
        fallback: true
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload image' });
  }
});

// Delete image endpoint
router.delete('/image', verifyAdmin, async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ message: 'No fileName provided' });
    }

    try {
      const bucket = admin.storage().bucket();
      const file = bucket.file(fileName);
      
      await file.delete();
      
      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (firebaseError) {
      console.error('Firebase delete error:', firebaseError);
      res.status(500).json({ 
        message: 'Failed to delete image',
        error: firebaseError.message
      });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete image' });
  }
});

module.exports = router;
