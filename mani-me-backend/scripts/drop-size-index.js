/**
 * Drop the old unique index on size field to allow multiple boxes with same size
 * Run: node scripts/drop-size-index.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mani-me');
    console.log('Connected to MongoDB');
    
    await mongoose.connection.db.collection('shippingboxes').dropIndex('size_1');
    console.log('✅ Index size_1 dropped successfully');
    
    process.exit(0);
  } catch (error) {
    if (error.message.includes('index not found')) {
      console.log('Index already dropped or does not exist');
      process.exit(0);
    }
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropIndex();
