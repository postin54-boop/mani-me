// ========================================
// BOOKING DATA - Admin-Controlled Pricing
// ========================================
// This file contains all box types and item categories
// Prices are managed by admin and fetched from backend
// Local prices are fallback values only

// ========================================
// SIZE CATEGORIES FOR CUSTOM ITEMS
// ========================================
export const CUSTOM_ITEM_SIZES = [
  {
    id: 'small',
    label: 'Small',
    description: 'Books, Shoes, Phone, Small toys, Handbag',
    estimatedWeight: 5,
    basePrice: 15,
    icon: '📦',
  },
  {
    id: 'medium',
    label: 'Medium',
    description: 'Blender, Toaster, Laptop, Standing Fan, Kettle',
    estimatedWeight: 15,
    basePrice: 35,
    icon: '📦📦',
  },
  {
    id: 'large',
    label: 'Large',
    description: 'Microwave, Small TV (32"), Printer, Suitcase',
    estimatedWeight: 30,
    basePrice: 55,
    icon: '📦📦📦',
  },
  {
    id: 'extra_large',
    label: 'Extra Large',
    description: 'Large TV (50"+), Washing Machine, Fridge, Sofa',
    estimatedWeight: 50,
    basePrice: 85,
    icon: '🏠',
  },
];

// ========================================
// A. BOX-BASED PARCELS (Admin-Priced)
// ========================================
export const BOX_TYPES = [
  {
    id: 'small_box',
    label: 'Small Box',
    icon: 'cube-outline',
    dimensions: '30cm × 30cm × 30cm',
    description: 'Perfect for clothes, shoes, small items',
    basePrice: 45, // Admin sets this - fallback only
    color: '#10B981',
  },
  {
    id: 'medium_box',
    label: 'Medium Box',
    icon: 'cube',
    dimensions: '45cm × 45cm × 45cm',
    description: 'Ideal for mixed items, gifts, electronics',
    basePrice: 75,
    color: '#3B82F6',
  },
  {
    id: 'large_box',
    label: 'Large Box',
    icon: 'cube',
    dimensions: '60cm × 60cm × 60cm',
    description: 'Great for bulk items, household goods',
    basePrice: 105,
    color: '#8B5CF6',
  },
  {
    id: 'extra_large_box',
    label: 'Extra-Large Box',
    icon: 'cube',
    dimensions: '75cm × 75cm × 75cm',
    description: 'Maximum capacity for large shipments',
    basePrice: 140,
    color: '#EC4899',
  },
  {
    id: 'barrel',
    label: 'Barrel / Drum',
    icon: 'file-tray-stacked',
    dimensions: '60L - 200L capacity',
    description: 'Heavy-duty container for bulk goods',
    basePrice: 180,
    color: '#F59E0B',
  },
];

// ========================================
// B. ITEM-BASED PARCELS (Structured Dropdowns)
// ========================================

export const ITEM_CATEGORIES = [
  {
    id: 'food_items',
    title: '🍚 Food Items',
    items: [
      {
        id: 'rice_25kg',
        label: 'Rice (25kg bag)',
        basePrice: 35,
        estimatedWeight: 25,
        size: 'Large',
      },
      {
        id: 'rice_50kg',
        label: 'Rice (50kg bag)',
        basePrice: 65,
        estimatedWeight: 50,
        size: 'Extra Large',
      },
      {
        id: 'cooking_oil',
        label: 'Cooking Oil (5L container)',
        basePrice: 20,
        estimatedWeight: 5,
        size: 'Medium',
      },
      {
        id: 'sardine_pack',
        label: 'Sardine Pack (24 tins)',
        basePrice: 25,
        estimatedWeight: 10,
        size: 'Medium',
      },
      {
        id: 'flour',
        label: 'Flour (10kg bag)',
        basePrice: 18,
        estimatedWeight: 10,
        size: 'Medium',
      },
      {
        id: 'sugar',
        label: 'Sugar (5kg bag)',
        basePrice: 15,
        estimatedWeight: 5,
        size: 'Small',
      },
      {
        id: 'other_food',
        label: 'Other Food Item',
        basePrice: 0, // Requires manual pricing
        estimatedWeight: null,
        size: null,
        requiresInput: true, // User must type custom name
      },
    ],
  },
  {
    id: 'household',
    title: '🏠 Household Essentials',
    items: [
      {
        id: 'diapers',
        label: 'Diapers (Carton)',
        basePrice: 30,
        estimatedWeight: 8,
        size: 'Large',
      },
      {
        id: 'toilet_rolls',
        label: 'Toilet Rolls (48-pack)',
        basePrice: 25,
        estimatedWeight: 6,
        size: 'Large',
      },
      {
        id: 'detergent',
        label: 'Detergent (5L bottle)',
        basePrice: 20,
        estimatedWeight: 5,
        size: 'Medium',
      },
      {
        id: 'soap_cartons',
        label: 'Soap (Carton)',
        basePrice: 28,
        estimatedWeight: 10,
        size: 'Medium',
      },
      {
        id: 'other_household',
        label: 'Other Household Item',
        basePrice: 0,
        estimatedWeight: null,
        size: null,
        requiresInput: true,
      },
    ],
  },
  {
    id: 'electronics',
    title: '📺 Electronics',
    items: [
      {
        id: 'tv_small',
        label: 'TV (Small - up to 32")',
        basePrice: 45,
        estimatedWeight: 8,
        size: 'Large',
      },
      {
        id: 'tv_medium',
        label: 'TV (Medium - 40" to 50")',
        basePrice: 75,
        estimatedWeight: 15,
        size: 'Extra Large',
      },
      {
        id: 'tv_large',
        label: 'TV (Large - 55" and above)',
        basePrice: 120,
        estimatedWeight: 25,
        size: 'Extra Large',
      },
      {
        id: 'washing_machine',
        label: 'Washing Machine',
        basePrice: 150,
        estimatedWeight: 60,
        size: 'Extra Large',
      },
      {
        id: 'fridge',
        label: 'Refrigerator / Fridge',
        basePrice: 180,
        estimatedWeight: 70,
        size: 'Extra Large',
      },
      {
        id: 'microwave',
        label: 'Microwave',
        basePrice: 35,
        estimatedWeight: 12,
        size: 'Medium',
      },
      {
        id: 'other_electronics',
        label: 'Other Electronic Item',
        basePrice: 0,
        estimatedWeight: null,
        size: null,
        requiresInput: true,
      },
    ],
  },
  {
    id: 'furniture',
    title: '🛋️ Furniture',
    items: [
      {
        id: 'mattress_single',
        label: 'Mattress (Single)',
        basePrice: 60,
        estimatedWeight: 20,
        size: 'Large',
      },
      {
        id: 'mattress_double',
        label: 'Mattress (Double)',
        basePrice: 85,
        estimatedWeight: 30,
        size: 'Extra Large',
      },
      {
        id: 'mattress_king',
        label: 'Mattress (King)',
        basePrice: 110,
        estimatedWeight: 40,
        size: 'Extra Large',
      },
      {
        id: 'sofa',
        label: 'Sofa / Couch',
        basePrice: 200,
        estimatedWeight: 80,
        size: 'Extra Large',
      },
      {
        id: 'bed_frame',
        label: 'Bed Frame',
        basePrice: 90,
        estimatedWeight: 35,
        size: 'Extra Large',
      },
      {
        id: 'table',
        label: 'Table (Dining / Coffee)',
        basePrice: 70,
        estimatedWeight: 25,
        size: 'Large',
      },
      {
        id: 'chair',
        label: 'Chair',
        basePrice: 35,
        estimatedWeight: 12,
        size: 'Medium',
      },
      {
        id: 'other_furniture',
        label: 'Other Furniture',
        basePrice: 0,
        estimatedWeight: null,
        size: null,
        requiresInput: true,
      },
    ],
  },
  {
    id: 'travel_luggage',
    title: '🧳 Travel & Luggage',
    items: [
      {
        id: 'suitcase',
        label: "Traveller's Suitcase (Standard)",
        basePrice: 40,
        estimatedWeight: 23,
        size: 'Large',
      },
      {
        id: 'travel_bag',
        label: 'Travel Bag / Duffel',
        basePrice: 30,
        estimatedWeight: 15,
        size: 'Medium',
      },
      {
        id: 'other_luggage',
        label: 'Other Luggage',
        basePrice: 0,
        estimatedWeight: null,
        size: null,
        requiresInput: true,
      },
    ],
  },
  {
    id: 'appliances',
    title: '⚡ Appliances',
    items: [
      {
        id: 'freezer',
        label: 'Freezer (Chest / Upright)',
        basePrice: 200,
        estimatedWeight: 80,
        size: 'Extra Large',
      },
      {
        id: 'cooker',
        label: 'Cooker / Stove',
        basePrice: 140,
        estimatedWeight: 50,
        size: 'Extra Large',
      },
      {
        id: 'fan',
        label: 'Fan (Standing / Table)',
        basePrice: 25,
        estimatedWeight: 8,
        size: 'Medium',
      },
      {
        id: 'other_appliance',
        label: 'Other Appliance',
        basePrice: 0,
        estimatedWeight: null,
        size: null,
        requiresInput: true,
      },
    ],
  },
  {
    id: 'other',
    title: '📦 Other / Not Listed',
    items: [
      {
        id: 'custom_item',
        label: 'Custom Item (Type name below)',
        basePrice: 0,
        estimatedWeight: null,
        size: null,
        requiresInput: true, // User MUST type custom name
      },
    ],
  },
];
