/**
 * Upload Controller
 * @module controllers/uploadController
 */

const { admin } = require('../firebase');
const logger = require('../utils/logger');

/**
 * Upload an image to Firebase Storage and return its public URL.
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const file = req.file;
    const timestamp = Date.now();
    const fileName = `products/${timestamp}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    try {
      const bucket = admin.storage().bucket();
      const fileRef = bucket.file(fileName);

      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
        public: true,
      });

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      res.json({
        success: true,
        url: publicUrl,
        fileName: fileName,
      });
    } catch (firebaseError) {
      logger.error('Firebase Storage error', { error: firebaseError.message });
      return res.status(500).json({
        message: 'Firebase Storage not configured. Please use image URL instead.',
        error: firebaseError.message,
        fallback: true
      });
    }
  } catch (error) {
    logger.error('Upload error', { error: error.message });
    res.status(500).json({ message: error.message || 'Failed to upload image' });
  }
};

/**
 * Delete an image from Firebase Storage by fileName.
 */
exports.deleteImage = async (req, res) => {
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
      logger.error('Firebase delete error', { error: firebaseError.message });
      res.status(500).json({
        message: 'Failed to delete image',
        error: firebaseError.message
      });
    }
  } catch (error) {
    logger.error('Delete error', { error: error.message });
    res.status(500).json({ message: error.message || 'Failed to delete image' });
  }
};
