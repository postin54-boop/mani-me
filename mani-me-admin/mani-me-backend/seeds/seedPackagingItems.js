const mongoose = require('mongoose');
const PackagingItem = require('../src/models/packagingItem');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable not set');
  process.exit(1);
}

const packagingItems = [
  {
    name: 'Small Box',
    category: 'Boxes',
    description: 'Perfect for small items and documents',
    price: 2.50,
    stock: 150,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1605902711834-8b11c3e3ef2f?w=400&h=400&fit=crop'
  },
  {
    name: 'Medium Box',
    category: 'Boxes',
    description: 'Ideal for clothes and everyday items',
    price: 4.00,
    stock: 200,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=400&h=400&fit=crop'
  },
  {
    name: 'Large Box',
    category: 'Boxes',
    description: 'Best for bulky items and multiple parcels',
    price: 6.50,
    stock: 120,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=400&h=400&fit=crop'
  },
  {
    name: 'Extra Large Box',
    category: 'Boxes',
    description: 'Maximum capacity for large shipments',
    price: 9.00,
    stock: 80,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1600861194942-f883fe1bb5b3?w=400&h=400&fit=crop'
  },
  {
    name: 'Packing Tape Roll',
    category: 'Tape',
    description: 'Heavy-duty packing tape (50m)',
    price: 1.50,
    stock: 300,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1565026465338-0e82bc49d030?w=400&h=400&fit=crop'
  },
  {
    name: 'Bubble Wrap (5m)',
    category: 'Protective',
    description: 'Protective bubble wrap for fragile items',
    price: 3.50,
    stock: 180,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1566885284421-8c7e3c0c4a54?w=400&h=400&fit=crop'
  },
  {
    name: 'Bubble Wrap (10m)',
    category: 'Protective',
    description: 'Extended length bubble wrap',
    price: 6.00,
    stock: 100,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1566885284421-8c7e3c0c4a54?w=400&h=400&fit=crop'
  },
  {
    name: 'Shrink Wrap Roll',
    category: 'Protective',
    description: 'Industrial shrink wrap for pallets',
    price: 8.50,
    stock: 60,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1595246140490-2ef2ee6b2f0e?w=400&h=400&fit=crop'
  },
  {
    name: 'Packing Peanuts (Bag)',
    category: 'Protective',
    description: 'Biodegradable packing peanuts',
    price: 2.00,
    stock: 150,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=400&fit=crop'
  },
  {
    name: 'Fragile Labels (10pk)',
    category: 'Labels',
    description: 'Handle with care stickers',
    price: 1.00,
    stock: 250,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1586864387634-7b93916b5a1d?w=400&h=400&fit=crop'
  },
  {
    name: 'This Side Up Labels (10pk)',
    category: 'Labels',
    description: 'Orientation labels',
    price: 1.00,
    stock: 200,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1605648916319-cf082f7524a1?w=400&h=400&fit=crop'
  },
  {
    name: 'Mattress Cover (Single)',
    category: 'Protective',
    description: 'Plastic mattress protector',
    price: 5.50,
    stock: 70,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=400&fit=crop'
  },
  {
    name: 'Mattress Cover (Double)',
    category: 'Protective',
    description: 'Plastic mattress protector - double size',
    price: 7.50,
    stock: 50,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=400&fit=crop'
  },
  {
    name: 'Plastic Drum (50L)',
    category: 'Drums',
    description: 'Heavy-duty plastic storage drum',
    price: 15.00,
    stock: 40,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=400&fit=crop'
  },
  {
    name: 'Plastic Drum (100L)',
    category: 'Drums',
    description: 'Large capacity storage drum',
    price: 25.00,
    stock: 25,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=400&fit=crop'
  },
  {
    name: 'Cellotape (24mm)',
    category: 'Tape',
    description: 'Standard clear tape',
    price: 0.80,
    stock: 400,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1565026465338-0e82bc49d030?w=400&h=400&fit=crop'
  },
  {
    name: 'Padlock with Keys',
    category: 'Locks',
    description: 'Heavy-duty security padlock',
    price: 4.50,
    stock: 100,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=400&fit=crop'
  },
  {
    name: 'Combination Lock',
    category: 'Locks',
    description: '4-digit combination padlock',
    price: 5.00,
    stock: 80,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1580983561371-7f4b242d8ec0?w=400&h=400&fit=crop'
  },
  {
    name: 'Packaging Marker Pen (Black)',
    category: 'Labels',
    description: 'Permanent marker for labeling',
    price: 1.20,
    stock: 200,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=400&fit=crop'
  },
  {
    name: 'Cable Ties (50pk)',
    category: 'Protective',
    description: 'Multi-purpose cable ties',
    price: 2.50,
    stock: 150,
    inStock: true,
    imageUrl: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=400&h=400&fit=crop'
  }
];

async function seedPackagingItems() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing items
    console.log('Clearing existing packaging items...');
    await PackagingItem.deleteMany({});

    // Insert new items
    console.log('Inserting new packaging items...');
    const inserted = await PackagingItem.insertMany(packagingItems);
    console.log(`Successfully inserted ${inserted.length} packaging items`);

    // Display summary
    console.log('\nItems by category:');
    const categories = {};
    inserted.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
    });
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} items`);
    });

    const totalValue = inserted.reduce((sum, item) => sum + (item.price * item.stock), 0);
    console.log(`\nTotal inventory value: £${totalValue.toFixed(2)}`);

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedPackagingItems();
