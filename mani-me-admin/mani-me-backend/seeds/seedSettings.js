const mongoose = require('mongoose');
const Settings = require('../src/models/settings');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable not set');
  process.exit(1);
}

const defaultSettings = [
  {
    key: 'warehouse_pickup_address',
    value: 'London Warehouse, E1 6AN',
    description: 'Warehouse pickup address shown to customers'
  }
];

async function seedSettings() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    for (const setting of defaultSettings) {
      const existing = await Settings.findOne({ key: setting.key });
      if (!existing) {
        await Settings.create(setting);
        console.log(`✓ Created setting: ${setting.key}`);
      } else {
        console.log(`- Setting already exists: ${setting.key}`);
      }
    }

    console.log('\n✅ Settings seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    process.exit(1);
  }
}

seedSettings();
