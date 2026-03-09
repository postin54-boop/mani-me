require('dotenv').config();
const mongoose = require('mongoose');

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const User = require('./src/models/user');
    const admin = await User.findOne({ email: 'admin@manime.com' });
    
    if (admin) {
      console.log('Admin found:');
      console.log('- ID:', admin._id);
      console.log('- Email:', admin.email);
      console.log('- Role:', admin.role);
      console.log('- Has password:', !!admin.password);
    } else {
      console.log('Admin NOT FOUND');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAdmin();
