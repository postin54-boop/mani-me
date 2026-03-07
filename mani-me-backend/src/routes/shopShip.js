const express = require('express');
const router = express.Router();
const shopShipController = require('../controllers/shopShipController');
const { requireAuth, verifyAdmin, optionalAuth } = require('../middleware/auth');

/**
 * Shop & Ship Routes
 * /api/shop-ship/*
 */

// ============ PUBLIC ROUTES ============

// Products - public access for browsing
router.get('/products', shopShipController.getProducts);
router.get('/products/:id', shopShipController.getProductById);
router.get('/categories', shopShipController.getCategories);
router.get('/featured', shopShipController.getFeaturedProducts);
router.get('/search', shopShipController.searchProducts);

// Shipping boxes - public for pricing display
router.get('/boxes', shopShipController.getShippingBoxes);
router.post('/calculate-shipping', shopShipController.calculateShipping);

// ============ AUTHENTICATED ROUTES ============

// Orders - require login
router.post('/orders', requireAuth, shopShipController.createOrder);
router.get('/orders', requireAuth, shopShipController.getMyOrders);
router.get('/orders/:id', requireAuth, shopShipController.getOrderById);
router.post('/orders/:id/cancel', requireAuth, shopShipController.cancelOrder);
router.post('/orders/:id/pay', requireAuth, shopShipController.createPaymentIntent);

// ============ ADMIN ROUTES ============

// Product management
router.post('/admin/products', verifyAdmin, shopShipController.addProduct);
router.put('/admin/products/:id', verifyAdmin, shopShipController.updateProduct);
router.delete('/admin/products/:id', verifyAdmin, shopShipController.deleteProduct);
router.post('/admin/products/bulk', verifyAdmin, shopShipController.bulkImportProducts);

// Order management
router.get('/admin/orders', verifyAdmin, shopShipController.getAllOrders);
router.put('/admin/orders/:id/status', verifyAdmin, shopShipController.updateOrderStatus);

// Seed shipping boxes (one-time)
router.post('/seed-boxes', verifyAdmin, shopShipController.seedBoxes);

module.exports = router;
