const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	fullName: { type: String, required: true },
	email: { type: String, unique: true, index: true },
	phone: { type: String, index: true },
	password: { type: String, required: true },
	push_token: { type: String }, // For push notifications
	
	// Driver-specific fields
	role: { 
		type: String, 
		enum: ["CUSTOMER", "UK_DRIVER", "GH_DRIVER", "ADMIN"], 
		default: "CUSTOMER",
		index: true
	},
	driver_type: { 
		type: String, 
		enum: ["pickup", "delivery", null], 
		default: null 
	}, // pickup = UK, delivery = Ghana
	country: { 
		type: String, 
		enum: ["UK", "Ghana", null], 
		default: null 
	},
	vehicle_number: { type: String },
	driver_license: { type: String },
	is_verified: { type: Boolean, default: false },
	is_active: { type: Boolean, default: true },

	// Profile
	profileImage: { type: String }, // Firebase Storage URL
	address: { type: String },

	// Password reset
	resetPasswordToken: { type: String, index: true },
	resetPasswordExpires: { type: Date },

	// Email verification
	email_verified: { type: Boolean, default: false },
	verification_token: { type: String, index: true },
	verification_token_expires: { type: Date },

	// Two-Factor Authentication (2FA)
	twoFactorEnabled: { type: Boolean, default: false },
	twoFactorSecret: { type: String, select: false }, // Hidden by default
	twoFactorBackupCodes: [{ type: String, select: false }], // One-time backup codes

	// Driver live location (updated by background tracking)
	last_location: {
		latitude: { type: Number },
		longitude: { type: Number },
		accuracy: { type: Number },
		heading: { type: Number },
		speed: { type: Number },
		updated_at: { type: Date },
	},
}, { timestamps: true });

// ========================================
// INDEXES FOR SCALABILITY (50k+ users)
// ========================================

// Compound index for driver queries
userSchema.index({ role: 1, country: 1, is_active: 1 }); // Active drivers by country
userSchema.index({ driver_type: 1, is_verified: 1, is_active: 1 }); // Verified drivers

// Text search for admin user lookup
userSchema.index({ fullName: 'text', email: 'text' });

module.exports = mongoose.model("User", userSchema);
