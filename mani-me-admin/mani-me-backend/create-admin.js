// Script to create an admin user
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mani-me';

// User schema (simplified)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  role: { type: String, default: 'USER' },
  is_active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'admin@manime.com';
    const adminPassword = 'admin123'; // Change this to a secure password
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', adminEmail);
      console.log('Updating to ensure ADMIN role...');
      
      // Update role to ADMIN
      existingAdmin.role = 'ADMIN';
      existingAdmin.is_active = true;
      await existingAdmin.save();
      
      console.log('✅ Admin user role updated');
    } else {
      // Hash password
      console.log('Hashing password...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      // Create admin user
      console.log('Creating admin user...');
      const admin = new User({
        email: adminEmail,
        password: hashedPassword,
        fullName: adminName,
        role: 'ADMIN',
        is_active: true
      });

      await admin.save();
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📧 Admin Credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

createAdmin();
