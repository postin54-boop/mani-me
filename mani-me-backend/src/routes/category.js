const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyAdmin } = require('../middleware/auth');

// Get all categories
router.get('/', categoryController.getCategories);

// Add a new category (admin only)
router.post('/', verifyAdmin, categoryController.addCategory);

module.exports = router;
