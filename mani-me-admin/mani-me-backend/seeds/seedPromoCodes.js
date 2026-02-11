/**
 * Seed script for initial promo codes
 * Run with: node seeds/seedPromoCodes.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PromoCode = require('../src/models/promoCode');

const promoCodes = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: 'Welcome offer for new customers - 10% off your first order',
    expiryDate: new Date('2026-12-31'),
    usageLimit: 1000,
    usedCount: 0,
    minOrderValue: 20,
    maxDiscount: 50,
    status: 'active',
    applicableTo: 'all'
  },
  {
    code: 'FESTIVE25',
    type: 'percentage',
    value: 25,
    description: 'Festive season special - 25% off',
    expiryDate: new Date('2026-12-25'),
    usageLimit: 500,
    usedCount: 0,
    minOrderValue: 50,
    maxDiscount: 100,
    status: 'active',
    applicableTo: 'shipping'
  },
  {
    code: 'FLAT5',
    type: 'fixed',
    value: 5,
    description: 'Flat £5 off on all orders',
    expiryDate: new Date('2027-01-31'),
    usageLimit: 2000,
    usedCount: 0,
    minOrderValue: 15,
    status: 'active',
    applicableTo: 'all'
  },
  {
    code: 'FREESHIP',
    type: 'fixed',
    value: 10,
    description: 'Free shipping on orders over £30',
    expiryDate: new Date('2026-12-31'),
    usageLimit: 500,
    usedCount: 0,
    minOrderValue: 30,
    status: 'active',
    applicableTo: 'grocery'
  },
  {
    code: 'SUMMER20',
    type: 'percentage',
    value: 20,
    description: 'Summer sale - 20% off',
    expiryDate: new Date('2026-08-31'),
    usageLimit: 300,
    usedCount: 0,
    minOrderValue: 25,
    maxDiscount: 75,
    status: 'active',
    applicableTo: 'all'
  }
];

async function seedPromoCodes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/mani-me';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Clear existing promo codes (optional - comment out to keep existing)
    // await PromoCode.deleteMany({});
    // console.log('🗑️  Cleared existing promo codes');

    // Check for existing codes and only add new ones
    let added = 0;
    let skipped = 0;

    for (const promo of promoCodes) {
      const existing = await PromoCode.findOne({ code: promo.code });
      if (!existing) {
        await PromoCode.create(promo);
        console.log(`  ➕ Added: ${promo.code}`);
        added++;
      } else {
        console.log(`  ⏭️  Skipped (exists): ${promo.code}`);
        skipped++;
      }
    }

    console.log(`\n✅ Seeding complete: ${added} added, ${skipped} skipped`);
    
    // Show all promo codes
    const allCodes = await PromoCode.find({}).select('code type value status');
    console.log('\n📋 Current promo codes:');
    allCodes.forEach(code => {
      console.log(`  - ${code.code}: ${code.type === 'percentage' ? code.value + '%' : '£' + code.value} (${code.status})`);
    });

  } catch (error) {
    console.error('❌ Error seeding promo codes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedPromoCodes();
