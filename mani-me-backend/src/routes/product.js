const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', productController.getProducts);
router.post('/', verifyAdmin, productController.createProduct);
router.put('/:id', verifyAdmin, productController.updateProduct);
router.delete('/:id', verifyAdmin, productController.deleteProduct);

module.exports = router;
