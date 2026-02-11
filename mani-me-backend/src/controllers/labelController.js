/**
 * Label Controller
 * @module controllers/labelController
 */

const { Shipment, Item } = require('../models');
const bwipjs = require('bwip-js');
const logger = require('../utils/logger');

/**
 * Generate a PNG or ZPL label for a shipment (QR code of tracking number).
 */
exports.getShipmentLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png' } = req.query;

    const shipment = await Shipment.findById(id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    if (format === 'png') {
      try {
        const png = await bwipjs.toBuffer({
          bcid: 'qrcode',
          text: shipment.tracking_number,
          scale: 6,
          includetext: true,
          textxalign: 'center',
        });
        res.set('Content-Type', 'image/png');
        res.send(png);
      } catch (bwipErr) {
        logger.error('Shipment label generation failed', { error: bwipErr.message, id });
        return res.status(500).json({ error: 'Label generation failed' });
      }
    } else if (format === 'zpl') {
      const zpl = `^XA^FO50,50^BQN,2,10^FDLA,${shipment.tracking_number}^FS^XZ`;
      res.set('Content-Type', 'text/plain');
      res.send(zpl);
    } else {
      res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    logger.error('Error generating shipment label', { error: error.message, id: req.params.id });
    res.status(500).json({ error: error.message });
  }
};

/**
 * Generate a PNG or ZPL label for an item (QR code of item_id).
 */
exports.getItemLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'png' } = req.query;

    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (format === 'png') {
      try {
        const png = await bwipjs.toBuffer({
          bcid: 'qrcode',
          text: item.item_id,
          scale: 6,
          includetext: true,
          textxalign: 'center',
        });
        res.set('Content-Type', 'image/png');
        res.send(png);
      } catch (bwipErr) {
        logger.error('Item label generation failed', { error: bwipErr.message, id });
        return res.status(500).json({ error: 'Label generation failed' });
      }
    } else if (format === 'zpl') {
      const zpl = `^XA^FO50,50^BQN,2,10^FDLA,${item.item_id}^FS^XZ`;
      res.set('Content-Type', 'text/plain');
      res.send(zpl);
    } else {
      res.status(400).json({ error: 'Invalid format' });
    }
  } catch (error) {
    logger.error('Error generating item label', { error: error.message, id: req.params.id });
    res.status(500).json({ error: error.message });
  }
};
