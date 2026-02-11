const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');
const { verifyAdmin } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/image', verifyAdmin, upload.single('image'), uploadController.uploadImage);
router.delete('/image', verifyAdmin, uploadController.deleteImage);

module.exports = router;
