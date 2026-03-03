const TrackingEvent = require('../models/trackingEvent');
const logger = require('../utils/logger');

exports.addTrackingEvent = async (req, res) => {
  try {
    const { parcel_id, status, actor, notes } = req.body;
    if (!parcel_id || !status) {
      return res.status(400).json({ error: 'parcel_id and status are required' });
    }
    const event = new TrackingEvent({ parcel_id, status, actor, notes });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    logger.error('Error adding tracking event:', { error: error.message });
    res.status(500).json({ error: 'Failed to add tracking event' });
  }
};

exports.getTrackingTimeline = async (req, res) => {
  try {
    const { parcel_id } = req.params;
    if (!parcel_id) {
      return res.status(400).json({ error: 'parcel_id is required' });
    }
    const events = await TrackingEvent.find({ parcel_id }).sort({ timestamp: 1 });
    res.json(events);
  } catch (error) {
    logger.error('Error getting tracking timeline:', { error: error.message });
    res.status(500).json({ error: 'Failed to get tracking timeline' });
  }
};
