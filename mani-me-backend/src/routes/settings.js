const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

router.get('/', verifyToken, settingsController.getAll);
router.get('/:key', verifyToken, settingsController.getByKey);
router.put('/:key', verifyAdmin, settingsController.upsert);
router.delete('/:key', verifyAdmin, settingsController.remove);

module.exports = router;
