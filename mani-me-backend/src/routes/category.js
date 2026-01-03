const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Get all categories
router.get('/', categoryController.getCategories);

// Add a new category
router.post('/', categoryController.addCategory);

module.exports = router;
