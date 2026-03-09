const express = require('express');
const router = express.Router();
const groceryController = require('../controllers/groceryController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { grocery } = require('../validations');

// Public
router.get('/items', validate(grocery.getItems), groceryController.getItems);
router.get('/items/:id', groceryController.getItem);

// Authenticated
router.post('/calculate-shipping', verifyToken, groceryController.calculateShipping);
router.post('/orders', verifyToken, validate(grocery.createOrder), groceryController.createOrder);
router.put('/orders/:id/payment', verifyToken, groceryController.updateOrderPayment);
router.get('/orders', verifyToken, groceryController.getUserOrders);
router.get('/orders/:id', verifyToken, groceryController.getUserOrder);

// Admin
router.get('/admin/items', verifyAdmin, validate(grocery.getItems), groceryController.adminGetItems);
router.post('/admin/items', verifyAdmin, validate(grocery.addItem), groceryController.adminCreateItem);
router.put('/admin/items/:id', verifyAdmin, validate(grocery.updateItem), groceryController.adminUpdateItem);
router.delete('/admin/items/:id', verifyAdmin, groceryController.adminDeleteItem);
router.get('/admin/orders', verifyAdmin, groceryController.adminGetOrders);
router.put('/admin/orders/:id', verifyAdmin, validate(grocery.updateOrderStatus), groceryController.adminUpdateOrder);

module.exports = router;
