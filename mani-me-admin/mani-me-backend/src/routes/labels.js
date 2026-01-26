const express = require('express');
const router = express.Router();
const { Shipment, Item } = require('../models');
const bwipjs = require('bwip-js'); // For barcode/QR PNG generation

// Generate PNG label for shipment
router.get('/shipment/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png' } = req.query;
    // Use Mongoose findById instead of Sequelize findByPk
    const shipment = await Shipment.findById(id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    // For demo: Use tracking_number as QR/barcode data
    if (format === 'png') {
      bwipjs.toBuffer({
        bcid: 'qrcode',
        text: shipment.tracking_number,
        scale: 6,
        includetext: true,
        textxalign: 'center',
      }, (err, png) => {
        if (err) return res.status(500).json({ error: 'Label generation failed' });
        res.set('Content-Type', 'image/png');
        res.send(png);
      });
    } else if (format === 'zpl') {
      // Simple ZPL for QR code (Zebra printers)
      const zpl = `^XA^FO50,50^BQN,2,10^FDLA,${shipment.tracking_number}^FS^XZ`;
      res.set('Content-Type', 'text/plain');
      res.send(zpl);
    } else {
      res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate PNG label for item
router.get('/item/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png' } = req.query;
    // Use Mongoose findById instead of Sequelize findByPk
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (format === 'png') {
      bwipjs.toBuffer({
        bcid: 'qrcode',
        text: item.item_id,
        scale: 6,
        includetext: true,
        textxalign: 'center',
      }, (err, png) => {
        if (err) return res.status(500).json({ error: 'Label generation failed' });
        res.set('Content-Type', 'image/png');
        res.send(png);
      });
    } else if (format === 'zpl') {
      const zpl = `^XA^FO50,50^BQN,2,10^FDLA,${item.item_id}^FS^XZ`;
      res.set('Content-Type', 'text/plain');
      res.send(zpl);
    } else {
      res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
