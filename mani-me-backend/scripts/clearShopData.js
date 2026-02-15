/**
 * Script to clear grocery and packaging items from database
 * Run with: node scripts/clearShopData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable not set');
  process.exit(1);
}

async function clearShopData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!\n');

    // Clear grocery items
    const groceryResult = await mongoose.connection.collection('groceryitems').deleteMany({});
    console.log(`✅ Deleted ${groceryResult.deletedCount} grocery items`);

    // Clear packaging items
    const packagingResult = await mongoose.connection.collection('packagingitems').deleteMany({});
    console.log(`✅ Deleted ${packagingResult.deletedCount} packaging items`);

    console.log('\n🎉 Shop data cleared successfully!');
    console.log('Admins can now add products manually via the admin dashboard.');

  } catch (error) {
    console.error('Error clearing shop data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

clearShopData();
