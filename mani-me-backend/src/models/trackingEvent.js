const mongoose = require('mongoose');

const TrackingEventSchema = new mongoose.Schema({
  parcel_id: { type: String, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String }, // user/driver/admin
  notes: { type: String },
});

module.exports = mongoose.model('TrackingEvent', TrackingEventSchema);
