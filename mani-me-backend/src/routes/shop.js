const express = require('express');
const router = express.Router();
const groceryController = require('../controllers/groceryController');
const shopController = require('../controllers/shopController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Grocery items (delegate to groceryController)
router.get('/grocery', groceryController.getItems);
router.post('/grocery', verifyAdmin, groceryController.adminCreateItem);
router.put('/grocery/:id', verifyAdmin, groceryController.adminUpdateItem);
router.delete('/grocery/:id', verifyAdmin, groceryController.adminDeleteItem);

// Packaging items
router.get('/packaging', shopController.getPackagingItems);
router.post('/packaging', verifyAdmin, shopController.createPackagingItem);
router.put('/packaging/:id', verifyAdmin, shopController.updatePackagingItem);
router.delete('/packaging/:id', verifyAdmin, shopController.deletePackagingItem);

// Packaging orders
router.post('/orders', verifyToken, shopController.createPackagingOrder);
router.get('/orders/user/:userId', verifyToken, shopController.getUserOrders);
router.get('/orders/:orderId', verifyToken, shopController.getOrderById);
router.get('/orders', verifyAdmin, shopController.adminGetOrders);
router.put('/orders/:orderId', verifyAdmin, shopController.adminUpdateOrder);

module.exports = router;
