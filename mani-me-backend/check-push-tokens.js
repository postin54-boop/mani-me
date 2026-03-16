require('dotenv').config();
const mongoose = require('mongoose');

async function checkPushTokens() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./src/models/user');
    
    const total = await User.countDocuments({ role: 'CUSTOMER' });
    const withToken = await User.countDocuments({ 
      role: 'CUSTOMER', 
      push_token: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log('\n📊 Push Token Stats:');
    console.log('Total CUSTOMER users:', total);
    console.log('Users with push tokens:', withToken);
    console.log('Users without push tokens:', total - withToken);
    
    // Sample of users
    const sample = await User.find({ role: 'CUSTOMER' })
      .select('fullName email push_token')
      .limit(5);
    
    console.log('\n📋 Sample users:');
    sample.forEach(u => {
      console.log(`  - ${u.fullName || u.email}: ${u.push_token ? '✅ Has token' : '❌ No token'}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPushTokens();
