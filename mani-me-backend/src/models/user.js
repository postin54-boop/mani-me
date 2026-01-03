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
