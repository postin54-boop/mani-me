const express = require('express');
const router = express.Router();
const groceryController = require('../controllers/groceryController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Public
router.get('/items', groceryController.getItems);
router.get('/items/:id', groceryController.getItem);

// Authenticated
router.post('/calculate-shipping', verifyToken, groceryController.calculateShipping);
router.post('/orders', verifyToken, groceryController.createOrder);
router.put('/orders/:id/payment', verifyToken, groceryController.updateOrderPayment);
router.get('/orders', verifyToken, groceryController.getUserOrders);
router.get('/orders/:id', verifyToken, groceryController.getUserOrder);

// Admin
router.get('/admin/items', verifyAdmin, groceryController.adminGetItems);
router.post('/admin/items', verifyAdmin, groceryController.adminCreateItem);
router.put('/admin/items/:id', verifyAdmin, groceryController.adminUpdateItem);
router.delete('/admin/items/:id', verifyAdmin, groceryController.adminDeleteItem);
router.get('/admin/orders', verifyAdmin, groceryController.adminGetOrders);
router.put('/admin/orders/:id', verifyAdmin, groceryController.adminUpdateOrder);

module.exports = router;
