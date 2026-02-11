const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCodeController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Admin
router.get('/', verifyAdmin, promoCodeController.getAll);
router.get('/stats/overview', verifyAdmin, promoCodeController.getStats);
router.get('/:id', verifyAdmin, promoCodeController.getById);
router.post('/', verifyAdmin, promoCodeController.create);
router.put('/:id', verifyAdmin, promoCodeController.update);
router.delete('/:id', verifyAdmin, promoCodeController.delete);

// Public/Auth
router.post('/validate', apiLimiter, promoCodeController.validate);
router.post('/apply', verifyToken, promoCodeController.apply);

module.exports = router;
