const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  deviceInfo: {
    platform: String, // 'ios', 'android', 'web'
    appVersion: String,
    deviceModel: String,
    deviceId: String,
  },
  ipAddress: String,
  userAgent: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  revokedReason: {
    type: String,
    enum: ['logout', 'password_change', 'admin_revoke', 'security', 'expired'],
    default: null,
  },
}, {
  timestamps: true,
});

// Index for cleanup of expired/revoked sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Check if session is valid
sessionSchema.methods.isValid = function() {
  return !this.revokedAt && this.expiresAt > new Date();
};

// Revoke session
sessionSchema.methods.revoke = async function(reason = 'logout') {
  this.revokedAt = new Date();
  this.revokedReason = reason;
  await this.save();
};

// Static method to revoke all sessions for a user
sessionSchema.statics.revokeAllForUser = async function(userId, reason = 'security', excludeToken = null) {
  const query = { 
    userId, 
    revokedAt: null,
  };
  if (excludeToken) {
    query.token = { $ne: excludeToken };
  }
  return this.updateMany(query, { 
    revokedAt: new Date(), 
    revokedReason: reason 
  });
};

// Static method to get active sessions for a user
sessionSchema.statics.getActiveSessions = async function(userId) {
  return this.find({
    userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ lastActivity: -1 });
};

// Static method to validate a token
sessionSchema.statics.validateToken = async function(token) {
  const session = await this.findOne({ token });
  if (!session) return { valid: false, reason: 'not_found' };
  if (session.revokedAt) return { valid: false, reason: 'revoked' };
  if (session.expiresAt < new Date()) return { valid: false, reason: 'expired' };
  
  // Update last activity
  session.lastActivity = new Date();
  await session.save();
  
  return { valid: true, session };
};

// Cleanup old sessions (call periodically)
sessionSchema.statics.cleanup = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { revokedAt: { $lt: thirtyDaysAgo } },
    ]
  });
};

module.exports = mongoose.model('Session', sessionSchema);
