require('dotenv').config();
const mongoose = require('mongoose');
const GroceryItem = require('../src/models/groceryItem');
const Settings = require('../src/models/settings');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable not set');
  process.exit(1);
}

const groceryItems = [
  // Grocery Category
  {
    name: 'Rice (5kg Bag)',
    description: 'Premium long grain white rice',
    price: 12.99,
    category: 'grocery',
    stock: 100,
    unit: 'bag',
    is_available: true
  },
  {
    name: 'Vegetable Oil (2L)',
    description: 'Pure vegetable cooking oil',
    price: 8.50,
    category: 'grocery',
    stock: 80,
    unit: 'bottle',
    is_available: true
  },
  {
    name: 'Sugar (1kg)',
    description: 'Granulated white sugar',
    price: 2.99,
    category: 'grocery',
    stock: 150,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Flour (1.5kg)',
    description: 'All-purpose wheat flour',
    price: 3.50,
    category: 'grocery',
    stock: 120,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Gari (White - 2kg)',
    description: 'Premium white gari',
    price: 6.99,
    category: 'grocery',
    stock: 90,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Tomato Paste (800g)',
    description: 'Concentrated tomato paste',
    price: 4.25,
    category: 'grocery',
    stock: 110,
    unit: 'tin',
    is_available: true
  },
  {
    name: 'Milk Powder (400g)',
    description: 'Full cream milk powder',
    price: 7.99,
    category: 'grocery',
    stock: 70,
    unit: 'tin',
    is_available: true
  },
  {
    name: 'Cornflakes (500g)',
    description: 'Breakfast cereal',
    price: 5.50,
    category: 'grocery',
    stock: 85,
    unit: 'box',
    is_available: true
  },
  {
    name: 'Instant Noodles (Pack of 10)',
    description: 'Quick meal noodles',
    price: 8.99,
    category: 'grocery',
    stock: 95,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Cooking Salt (500g)',
    description: 'Iodized table salt',
    price: 1.50,
    category: 'grocery',
    stock: 200,
    unit: 'pack',
    is_available: true
  },

  // Electronics Category
  {
    name: 'LED Bulb (12W - Pack of 4)',
    description: 'Energy-saving LED bulbs',
    price: 15.99,
    category: 'electronics',
    stock: 60,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Phone Charger (Fast Charge)',
    description: 'Universal USB fast charger',
    price: 12.50,
    category: 'electronics',
    stock: 75,
    unit: 'item',
    is_available: true
  },
  {
    name: 'Power Extension (4-Way)',
    description: '4-socket power extension cable',
    price: 18.99,
    category: 'electronics',
    stock: 50,
    unit: 'item',
    is_available: true
  },
  {
    name: 'Rechargeable Fan',
    description: 'Portable rechargeable fan with LED',
    price: 35.00,
    category: 'electronics',
    stock: 40,
    unit: 'item',
    is_available: true
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Wireless portable speaker',
    price: 28.99,
    category: 'electronics',
    stock: 45,
    unit: 'item',
    is_available: true
  },
  {
    name: 'Phone Case & Screen Protector Set',
    description: 'Universal phone protection kit',
    price: 9.99,
    category: 'electronics',
    stock: 100,
    unit: 'set',
    is_available: true
  },
  {
    name: 'USB Flash Drive (32GB)',
    description: 'High-speed USB 3.0 flash drive',
    price: 11.50,
    category: 'electronics',
    stock: 80,
    unit: 'item',
    is_available: true
  },
  {
    name: 'Earphones (Wired)',
    description: 'Quality wired earphones',
    price: 7.99,
    category: 'electronics',
    stock: 90,
    unit: 'item',
    is_available: true
  },

  // Household Category
  {
    name: 'Laundry Detergent (3kg)',
    description: 'Powder laundry detergent',
    price: 11.99,
    category: 'household',
    stock: 70,
    unit: 'box',
    is_available: true
  },
  {
    name: 'Dish Soap (1L)',
    description: 'Concentrated dishwashing liquid',
    price: 4.99,
    category: 'household',
    stock: 100,
    unit: 'bottle',
    is_available: true
  },
  {
    name: 'Toilet Paper (12 Rolls)',
    description: 'Soft 3-ply toilet tissue',
    price: 8.50,
    category: 'household',
    stock: 85,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Air Freshener (300ml)',
    description: 'Room air freshener spray',
    price: 5.50,
    category: 'household',
    stock: 95,
    unit: 'can',
    is_available: true
  },
  {
    name: 'Plastic Buckets (Set of 3)',
    description: 'Durable plastic buckets',
    price: 14.99,
    category: 'household',
    stock: 55,
    unit: 'set',
    is_available: true
  },
  {
    name: 'Kitchen Towels (Pack of 6)',
    description: 'Absorbent kitchen roll',
    price: 6.99,
    category: 'household',
    stock: 75,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Mop & Bucket Set',
    description: 'Complete floor cleaning set',
    price: 19.99,
    category: 'household',
    stock: 40,
    unit: 'set',
    is_available: true
  },
  {
    name: 'Hangers (Pack of 20)',
    description: 'Plastic clothes hangers',
    price: 7.99,
    category: 'household',
    stock: 110,
    unit: 'pack',
    is_available: true
  },
  {
    name: 'Bedsheets (Queen Size)',
    description: 'Cotton bedsheet set with pillowcases',
    price: 29.99,
    category: 'household',
    stock: 50,
    unit: 'set',
    is_available: true
  },
  {
    name: 'Mosquito Net',
    description: 'Double bed mosquito net',
    price: 16.99,
    category: 'household',
    stock: 45,
    unit: 'item',
    is_available: true
  }
];

async function seedGroceryData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing grocery items
    await GroceryItem.deleteMany({});
    console.log('Cleared existing grocery items');

    // Insert new items
    await GroceryItem.insertMany(groceryItems);
    console.log(`Seeded ${groceryItems.length} grocery items`);

    // Set UK to Ghana shipping rate
    await Settings.findOneAndUpdate(
      { key: 'uk_ghana_shipping_rate' },
      {
        key: 'uk_ghana_shipping_rate',
        value: '15.00',
        description: 'Flat rate shipping cost from UK to Ghana for grocery orders (in GBP)'
      },
      { upsert: true, new: true }
    );
    console.log('Set UK to Ghana shipping rate: £15.00');

    console.log('\n✅ Grocery shop data seeded successfully!');
    console.log('\nCategories:');
    console.log(`- Grocery: ${groceryItems.filter(i => i.category === 'grocery').length} items`);
    console.log(`- Electronics: ${groceryItems.filter(i => i.category === 'electronics').length} items`);
    console.log(`- Household: ${groceryItems.filter(i => i.category === 'household').length} items`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

seedGroceryData();
