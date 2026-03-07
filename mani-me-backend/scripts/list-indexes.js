/**
 * List indexes on shippingboxes collection
 * Run: node scripts/list-indexes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function listIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mani-me');
    console.log('Connected to MongoDB');
    
    const indexes = await mongoose.connection.db.collection('shippingboxes').indexes();
    console.log('Indexes on shippingboxes:');
    console.log(JSON.stringify(indexes, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

listIndexes();
