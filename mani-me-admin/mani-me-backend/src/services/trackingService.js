// Example: Tracking service with business logic
const TrackingEvent = require('../models/trackingEvent');

exports.addTrackingEvent = async (parcel_id, status, actor, notes) => {
  const event = new TrackingEvent({ parcel_id, status, actor, notes });
  await event.save();
  return event;
};

exports.getTrackingTimeline = async (parcel_id) => {
  return TrackingEvent.find({ parcel_id }).sort({ timestamp: 1 });
};
