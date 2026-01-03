// Reset admin password script
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI;
const NEW_PASSWORD = process.argv[2] || 'Domini123';

async function resetPassword() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected');

    const User = require('./src/models/user');
    
    // Find admin
    const admin = await User.findOne({ email: 'admin@manime.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      process.exit(1);
    }

    console.log('Found admin:', admin.email);
    console.log('Current password hash:', admin.password.substring(0, 20) + '...');

    // Hash new password
    console.log('Hashing new password:', NEW_PASSWORD);
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('New hash:', hashedPassword.substring(0, 20) + '...');

    // Update directly using updateOne to bypass any hooks
    const result = await User.updateOne(
      { email: 'admin@manime.com' },
      { $set: { password: hashedPassword } }
    );

    console.log('Update result:', result);

    // Verify it was saved
    const updated = await User.findOne({ email: 'admin@manime.com' });
    console.log('Updated hash:', updated.password.substring(0, 20) + '...');

    // Test the new password
    const matches = await bcrypt.compare(NEW_PASSWORD, updated.password);
    console.log('Password verification:', matches ? '✅ SUCCESS' : '❌ FAILED');

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

resetPassword();
