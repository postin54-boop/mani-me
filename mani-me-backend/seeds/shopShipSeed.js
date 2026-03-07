/**
 * Seed Script for Shop & Ship Products
 * Run: node seeds/shopShipSeed.js
 * 
 * Seeds shipping boxes and sample products curated for Ghana market
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ExternalProduct = require('../src/models/externalProduct');
const ShippingBox = require('../src/models/shippingBox');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mani-me';

// Shipping boxes with flat-rate pricing
const shippingBoxes = [
  {
    name: 'Small Box',
    description: 'Perfect for small electronics, documents, and lightweight items',
    size: 'small',
    max_weight_kg: 5,
    min_weight_kg: 0,
    dimensions: { length_cm: 30, width_cm: 20, height_cm: 15 },
    price_gbp: 25,
    icon: 'cube-outline',
    color: '#10B981'
  },
  {
    name: 'Medium Box',
    description: 'Great for clothes, household items, and medium electronics',
    size: 'medium',
    max_weight_kg: 15,
    min_weight_kg: 5,
    dimensions: { length_cm: 45, width_cm: 35, height_cm: 30 },
    price_gbp: 45,
    icon: 'cube',
    color: '#3B82F6'
  },
  {
    name: 'Large Box',
    description: 'Ideal for bulk groceries, multiple items, or large electronics',
    size: 'large',
    max_weight_kg: 30,
    min_weight_kg: 15,
    dimensions: { length_cm: 60, width_cm: 45, height_cm: 40 },
    price_gbp: 75,
    icon: 'archive',
    color: '#F59E0B'
  },
  {
    name: 'Extra Large Box',
    description: 'Maximum capacity for heavy or bulky shipments',
    size: 'extra_large',
    max_weight_kg: 50,
    min_weight_kg: 30,
    dimensions: { length_cm: 80, width_cm: 60, height_cm: 50 },
    price_gbp: 120,
    icon: 'filing',
    color: '#8B5CF6'
  }
];

// Sample products curated for Ghana market
const sampleProducts = [
  // Electronics
  {
    name: 'Samsung Galaxy A54 5G',
    description: 'Awesome screen. Awesome camera. Awesome battery life. This phone has it all. 128GB, Graphite.',
    category: 'electronics',
    subcategory: 'smartphones',
    price: 349,
    original_price: 399,
    images: ['https://images.samsung.com/uk/smartphones/galaxy-a54-5g/images/galaxy-a54-5g-highlights-kv.jpg'],
    thumbnail: 'https://images.samsung.com/uk/smartphones/galaxy-a54-5g/images/galaxy-a54-5g-highlights-kv.jpg',
    retailer: 'amazon',
    weight_kg: 0.5,
    dimensions: { length_cm: 16, width_cm: 8, height_cm: 4 },
    featured: true,
    ghana_popular: true,
    tags: ['phone', 'samsung', 'android', '5g', 'smartphone']
  },
  {
    name: 'Apple iPhone 15 128GB',
    description: 'Dynamic Island. 48MP camera. A16 Bionic chip. USB-C connector.',
    category: 'electronics',
    subcategory: 'smartphones',
    price: 799,
    original_price: 849,
    images: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-black'],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-black',
    retailer: 'amazon',
    weight_kg: 0.5,
    dimensions: { length_cm: 16, width_cm: 8, height_cm: 4 },
    featured: true,
    ghana_popular: true,
    tags: ['phone', 'apple', 'iphone', 'smartphone', 'ios']
  },
  {
    name: 'Samsung 55" Crystal UHD 4K Smart TV',
    description: 'Crystal Processor 4K optimizes content to spectacular 4K resolution. Gaming Hub built in.',
    category: 'electronics',
    subcategory: 'tvs',
    price: 399,
    original_price: 499,
    images: ['https://images.samsung.com/is/image/samsung/p6pim/uk/ua55cu7100kxxu/gallery/uk-crystal-uhd-cu7100-ua55cu7100kxxu-536548527'],
    thumbnail: 'https://images.samsung.com/is/image/samsung/p6pim/uk/ua55cu7100kxxu/gallery/uk-crystal-uhd-cu7100-ua55cu7100kxxu-536548527',
    retailer: 'currys',
    weight_kg: 15,
    dimensions: { length_cm: 125, width_cm: 75, height_cm: 15 },
    featured: true,
    ghana_popular: true,
    tags: ['tv', 'samsung', '4k', 'smart tv', 'television']
  },
  {
    name: 'Apple MacBook Air M2',
    description: 'Supercharged by M2. 13.6-inch Liquid Retina display. 8GB RAM, 256GB SSD.',
    category: 'electronics',
    subcategory: 'laptops',
    price: 999,
    original_price: 1149,
    images: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-midnight-select-20220606'],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-midnight-select-20220606',
    retailer: 'amazon',
    weight_kg: 1.5,
    dimensions: { length_cm: 32, width_cm: 23, height_cm: 3 },
    featured: true,
    ghana_popular: true,
    tags: ['laptop', 'apple', 'macbook', 'computer']
  },
  {
    name: 'Apple iPad 10th Generation 64GB',
    description: '10.9-inch Liquid Retina display. A14 Bionic chip. 12MP cameras front and back.',
    category: 'electronics',
    subcategory: 'tablets',
    price: 349,
    original_price: 399,
    images: ['https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-10th-gen-finish-select-202212-blue'],
    thumbnail: 'https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-10th-gen-finish-select-202212-blue',
    retailer: 'amazon',
    weight_kg: 0.7,
    dimensions: { length_cm: 25, width_cm: 18, height_cm: 2 },
    featured: true,
    ghana_popular: true,
    tags: ['tablet', 'apple', 'ipad']
  },
  
  // Kitchen
  {
    name: 'Ninja Professional Blender BL610',
    description: '1000-Watt motor crushes ice and blends frozen fruit. 72 oz. pitcher, 6-blade technology.',
    category: 'kitchen',
    subcategory: 'blenders',
    price: 79,
    original_price: 99,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71w0WDPVKPL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71w0WDPVKPL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 4,
    dimensions: { length_cm: 40, width_cm: 25, height_cm: 45 },
    featured: true,
    ghana_popular: true,
    tags: ['blender', 'ninja', 'kitchen', 'appliance']
  },
  {
    name: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
    description: 'Pressure cooker, slow cooker, rice cooker, steamer, sauté, yogurt maker, and warmer. 6 Quart.',
    category: 'kitchen',
    subcategory: 'cookers',
    price: 89,
    original_price: 119,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71V1LrY1MSL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71V1LrY1MSL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 5,
    dimensions: { length_cm: 35, width_cm: 35, height_cm: 35 },
    featured: true,
    ghana_popular: true,
    tags: ['instant pot', 'pressure cooker', 'kitchen', 'appliance', 'rice cooker']
  },
  {
    name: 'Panasonic NN-E28JBM Microwave 20L',
    description: 'Compact microwave with auto defrost. 800W power, 9 auto cook menus.',
    category: 'kitchen',
    subcategory: 'microwaves',
    price: 65,
    original_price: 79,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71Dt5i3k5KL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71Dt5i3k5KL._AC_SL1500_.jpg',
    retailer: 'argos',
    weight_kg: 11,
    dimensions: { length_cm: 45, width_cm: 35, height_cm: 28 },
    ghana_popular: true,
    tags: ['microwave', 'panasonic', 'kitchen', 'appliance']
  },
  {
    name: 'Russell Hobbs 1.7L Electric Kettle',
    description: 'Rapid boil electric kettle with quiet boil technology. Stainless steel.',
    category: 'kitchen',
    subcategory: 'kettles',
    price: 35,
    original_price: 45,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71DpG3EzqDL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71DpG3EzqDL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 1.5,
    dimensions: { length_cm: 25, width_cm: 20, height_cm: 30 },
    ghana_popular: true,
    tags: ['kettle', 'russell hobbs', 'kitchen', 'appliance']
  },
  
  // Baby
  {
    name: 'Pampers Baby-Dry Size 4 Nappies (174 Count)',
    description: 'Up to 12 hours of overnight dryness. Dermatologically tested.',
    category: 'baby',
    subcategory: 'nappies',
    price: 32,
    original_price: 40,
    images: ['https://images-na.ssl-images-amazon.com/images/I/81YIXuKnDAL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/81YIXuKnDAL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 5,
    dimensions: { length_cm: 40, width_cm: 30, height_cm: 25 },
    featured: true,
    ghana_popular: true,
    tags: ['nappies', 'pampers', 'baby', 'diapers']
  },
  {
    name: 'Aptamil First Infant Milk 800g (6 Pack)',
    description: 'From birth, suitable as a complete feed or to complement breastfeeding.',
    category: 'baby',
    subcategory: 'formula',
    price: 72,
    original_price: 84,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71u8NblE6QL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71u8NblE6QL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 5,
    dimensions: { length_cm: 35, width_cm: 25, height_cm: 20 },
    featured: true,
    ghana_popular: true,
    tags: ['baby formula', 'aptamil', 'baby', 'milk', 'infant']
  },
  {
    name: 'Chicco Baby Walker First Steps Music',
    description: 'Helps baby take their first steps safely. Adjustable speed, fun sounds and melodies.',
    category: 'baby',
    subcategory: 'walkers',
    price: 45,
    original_price: 55,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71wQQO-YnqL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71wQQO-YnqL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 3,
    dimensions: { length_cm: 50, width_cm: 45, height_cm: 55 },
    ghana_popular: true,
    tags: ['baby walker', 'chicco', 'baby', 'walker']
  },
  
  // Food & Groceries
  {
    name: 'Heinz Baked Beans 415g (12 Pack)',
    description: 'Classic baked beans in rich tomato sauce. High in protein and fibre.',
    category: 'food',
    subcategory: 'tinned',
    price: 14,
    original_price: 18,
    images: ['https://images-na.ssl-images-amazon.com/images/I/91tJgIJiuML._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/91tJgIJiuML._AC_SL1500_.jpg',
    retailer: 'asda',
    weight_kg: 5.5,
    dimensions: { length_cm: 30, width_cm: 25, height_cm: 15 },
    ghana_popular: true,
    tags: ['beans', 'heinz', 'food', 'tinned food', 'groceries']
  },
  {
    name: 'Quality Street 1.9kg Tin',
    description: 'Assortment of delicious sweets and chocolates. Perfect for sharing.',
    category: 'food',
    subcategory: 'sweets',
    price: 15,
    original_price: 18,
    images: ['https://images-na.ssl-images-amazon.com/images/I/81F9EYmD5vL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/81F9EYmD5vL._AC_SL1500_.jpg',
    retailer: 'tesco',
    weight_kg: 2,
    dimensions: { length_cm: 25, width_cm: 25, height_cm: 15 },
    featured: true,
    ghana_popular: true,
    tags: ['chocolate', 'sweets', 'quality street', 'food', 'gifts']
  },
  {
    name: 'Kellogg\'s Corn Flakes 720g (4 Pack)',
    description: 'The original and best. High in vitamins B6, B12 and iron.',
    category: 'food',
    subcategory: 'cereals',
    price: 12,
    original_price: 16,
    images: ['https://images-na.ssl-images-amazon.com/images/I/81DqJ7KJDEL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/81DqJ7KJDEL._AC_SL1500_.jpg',
    retailer: 'asda',
    weight_kg: 3,
    dimensions: { length_cm: 35, width_cm: 25, height_cm: 30 },
    ghana_popular: true,
    tags: ['cereal', 'kelloggs', 'corn flakes', 'food', 'breakfast']
  },
  
  // Household
  {
    name: 'Silentnight Luxury Hotel Collection 10.5 Tog Duvet - King',
    description: 'Hotel quality duvet with soft peach feel. Machine washable at 40°C.',
    category: 'household',
    subcategory: 'bedding',
    price: 40,
    original_price: 55,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71dK0L+EgNL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71dK0L+EgNL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 3,
    dimensions: { length_cm: 50, width_cm: 40, height_cm: 20 },
    ghana_popular: true,
    tags: ['duvet', 'bedding', 'household', 'silentnight']
  },
  {
    name: 'Egyptian Cotton Towel Set (6 Piece)',
    description: 'Luxury 700gsm towels. Includes 2 bath towels, 2 hand towels, 2 face cloths.',
    category: 'household',
    subcategory: 'towels',
    price: 45,
    original_price: 60,
    images: ['https://images-na.ssl-images-amazon.com/images/I/81Xl6F1TtQL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/81Xl6F1TtQL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 3,
    dimensions: { length_cm: 40, width_cm: 35, height_cm: 20 },
    ghana_popular: true,
    tags: ['towels', 'egyptian cotton', 'household', 'bathroom']
  },
  
  // Health & Beauty
  {
    name: 'Centrum Advance Multivitamins (180 Tablets)',
    description: 'Complete from A to Zinc. Contains vitamins and minerals to support your health.',
    category: 'health',
    subcategory: 'vitamins',
    price: 18,
    original_price: 25,
    images: ['https://images-na.ssl-images-amazon.com/images/I/71OMsyqQBbL._AC_SL1500_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/71OMsyqQBbL._AC_SL1500_.jpg',
    retailer: 'amazon',
    weight_kg: 0.4,
    dimensions: { length_cm: 12, width_cm: 8, height_cm: 15 },
    ghana_popular: true,
    tags: ['vitamins', 'centrum', 'health', 'supplements']
  },
  {
    name: 'Palmer\'s Cocoa Butter Formula Skin Therapy Oil',
    description: 'Multi-use skin oil for face, body, and hair. With Vitamin E.',
    category: 'beauty',
    subcategory: 'skincare',
    price: 8,
    original_price: 12,
    images: ['https://images-na.ssl-images-amazon.com/images/I/61kBsVsJWaL._AC_SL1000_.jpg'],
    thumbnail: 'https://images-na.ssl-images-amazon.com/images/I/61kBsVsJWaL._AC_SL1000_.jpg',
    retailer: 'amazon',
    weight_kg: 0.3,
    dimensions: { length_cm: 8, width_cm: 5, height_cm: 20 },
    featured: true,
    ghana_popular: true,
    tags: ['skincare', 'palmers', 'cocoa butter', 'beauty', 'oil']
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Seed shipping boxes
    console.log('\nSeeding shipping boxes...');
    for (const box of shippingBoxes) {
      await ShippingBox.findOneAndUpdate(
        { size: box.size },
        box,
        { upsert: true, new: true }
      );
      console.log(`  ✓ ${box.name}`);
    }
    console.log(`Seeded ${shippingBoxes.length} shipping boxes`);
    
    // Seed products
    console.log('\nSeeding products...');
    let created = 0;
    let updated = 0;
    
    for (const product of sampleProducts) {
      const existing = await ExternalProduct.findOne({ name: product.name });
      if (existing) {
        await ExternalProduct.findByIdAndUpdate(existing._id, product);
        updated++;
        console.log(`  ↻ ${product.name} (updated)`);
      } else {
        await ExternalProduct.create(product);
        created++;
        console.log(`  ✓ ${product.name} (created)`);
      }
    }
    
    console.log(`\nProducts: ${created} created, ${updated} updated`);
    console.log('\n✅ Shop & Ship seed complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seedDatabase();
