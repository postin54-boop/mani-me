// Script to change admin password
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const readline = require('readline');
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

// Create readline interface for password input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function changeAdminPassword() {
  try {
    console.log('🔐 Admin Password Change Tool\n');
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get admin email
    const adminEmail = await askQuestion('Enter admin email (default: admin@manime.com): ');
    const email = adminEmail.trim() || 'admin@manime.com';

    // Find admin user
    const adminUser = await User.findOne({ email, role: 'ADMIN' });
    
    if (!adminUser) {
      console.log(`❌ Admin user not found with email: ${email}`);
      console.log('Available admin users:');
      const admins = await User.find({ role: 'ADMIN' });
      admins.forEach(admin => console.log(`   - ${admin.email}`));
      rl.close();
      mongoose.connection.close();
      process.exit(1);
    }

    console.log(`✅ Found admin user: ${adminUser.fullName || adminUser.email}\n`);

    // Get new password
    const newPassword = await askQuestion('Enter new password: ');
    
    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      rl.close();
      mongoose.connection.close();
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await askQuestion('Confirm new password: ');
    
    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match');
      rl.close();
      mongoose.connection.close();
      process.exit(1);
    }

    // Hash password
    console.log('\nHashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('\n✅ Password changed successfully!');
    console.log('\n📧 Admin Credentials:');
    console.log('   Email:', email);
    console.log('   Password: [your new password]');
    console.log('\nYou can now login with the new password.');

    rl.close();
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error changing password:', error);
    rl.close();
    mongoose.connection.close();
    process.exit(1);
  }
}

changeAdminPassword();
