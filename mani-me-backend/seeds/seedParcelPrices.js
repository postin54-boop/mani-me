require('dotenv').config();
const mongoose = require('mongoose');
const ParcelPrice = require('../src/models/parcelPrice');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mani-me';

const parcelPrices = [
  { type: 'small_box', label: 'Small Box', price: 15.00, currency: 'GBP' },
  { type: 'medium_box', label: 'Medium Box', price: 25.00, currency: 'GBP' },
  { type: 'large_box', label: 'Large Box', price: 35.00, currency: 'GBP' },
  { type: 'tv', label: 'TV', price: 50.00, currency: 'GBP' },
  { type: 'drum', label: 'Drum', price: 45.00, currency: 'GBP' },
];

async function seedPrices() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Clearing existing parcel prices...');
    await ParcelPrice.deleteMany({});

    console.log('Seeding parcel prices...');
    for (const price of parcelPrices) {
      await ParcelPrice.create({
        ...price,
        lastUpdated: new Date()
      });
      console.log(`✓ ${price.label}: £${price.price}`);
    }

    console.log('\n✅ Parcel prices seeded successfully!');
    console.log(`Total: ${parcelPrices.length} price tiers`);
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding parcel prices:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

seedPrices();
