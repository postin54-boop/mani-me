const TrackingEvent = require('../models/trackingEvent');

exports.addTrackingEvent = async (req, res) => {
  // ...validate input
  const { parcel_id, status, actor, notes } = req.body;
  const event = new TrackingEvent({ parcel_id, status, actor, notes });
  await event.save();
  res.status(201).json(event);
};

exports.getTrackingTimeline = async (req, res) => {
  const { parcel_id } = req.params;
  const events = await TrackingEvent.find({ parcel_id }).sort({ timestamp: 1 });
  res.json(events);
};
