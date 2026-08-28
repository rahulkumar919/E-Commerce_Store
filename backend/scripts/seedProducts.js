/**
 * Seed Script — STM Fruit Shop
 * Adds sample products: Fruits, Cakes, Birthday items, Dry Fruits, Juice
 * Also adds sample banners (cover images)
 * 
 * Run: cd backend && node scripts/seedProducts.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const productModel = require('../models/productModel');

// ── Free Cloudinary/Unsplash image URLs ──────────────────────────────────────
// Using publicly accessible product images
const PRODUCTS = [

  // ═══════════════════ FRUITS ═══════════════════
  {
    productName: 'Fresh Red Apples (Shimla)',
    brandName: 'STM Fresh',
    category: 'Fruits',
    subcategory: 'Fresh Fruits',
    productImage: [
      'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
      'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80',
    ],
    price: 180,
    selling: 149,
    description: 'Fresh Shimla apples, hand-picked from the orchards. Rich in fiber, Vitamin C and antioxidants. Perfect for daily health.',
    badge: 'Best Seller',
    rating: 4.5,
    reviewCount: 128,
    stock: 100,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
    isBestseller: true,
  },
  {
    productName: 'Alphonso Mangoes (1 kg)',
    brandName: 'STM Fresh',
    category: 'Fruits',
    subcategory: 'Seasonal Fruits',
    productImage: [
      'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=80',
      'https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=80',
    ],
    price: 350,
    selling: 299,
    description: 'Premium Alphonso mangoes from Ratnagiri. Known as the King of Mangoes — sweet, juicy and fragrant.',
    badge: 'New Arrival',
    rating: 4.8,
    reviewCount: 95,
    stock: 60,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
  },
  {
    productName: 'Sweet Bananas (Dozen)',
    brandName: 'STM Fresh',
    category: 'Fruits',
    subcategory: 'Fresh Fruits',
    productImage: [
      'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
    ],
    price: 80,
    selling: 60,
    description: 'Fresh yellow bananas, rich in potassium and natural energy. Great for kids and athletes.',
    rating: 4.3,
    reviewCount: 67,
    stock: 200,
    isAvailable: true,
    isTrending: false,
  },
  {
    productName: 'Black Grapes (500g)',
    brandName: 'STM Fresh',
    category: 'Fruits',
    subcategory: 'Fresh Fruits',
    productImage: [
      'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400&q=80',
    ],
    price: 120,
    selling: 99,
    description: 'Juicy black grapes loaded with resveratrol and antioxidants. Good for heart health.',
    rating: 4.4,
    reviewCount: 43,
    stock: 80,
    isAvailable: true,
  },
  {
    productName: 'Fresh Oranges (4 pcs)',
    brandName: 'STM Fresh',
    category: 'Fruits',
    subcategory: 'Fresh Fruits',
    productImage: [
      'https://images.unsplash.com/photo-1547514701-42782101795e?w=400&q=80',
    ],
    price: 100,
    selling: 79,
    description: 'Vitamin C-rich fresh oranges. Boost your immunity naturally with these juicy fruits.',
    rating: 4.2,
    reviewCount: 55,
    stock: 120,
    isAvailable: true,
    isTrending: true,
  },
  {
    productName: 'Fresh Papaya (1 pc)',
    brandName: 'STM Fresh',
    category: 'Fruits',
    subcategory: 'Fresh Fruits',
    productImage: [
      'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=400&q=80',
    ],
    price: 80,
    selling: 65,
    description: 'Ripe golden papaya — excellent for digestion and skin glow. Rich in Vitamin A and C.',
    rating: 4.1,
    reviewCount: 32,
    stock: 50,
    isAvailable: true,
  },

  // ═══════════════════ DRY FRUITS ═══════════════════
  {
    productName: 'Premium Cashews (250g)',
    brandName: 'STM Premium',
    category: 'Dry Fruits',
    subcategory: 'Nuts',
    productImage: [
      'https://images.unsplash.com/photo-1563412886265-c3cb62f1fdc0?w=400&q=80',
    ],
    price: 320,
    selling: 269,
    description: 'W320 grade premium cashews. Crunchy, nutritious and perfect for gifting or snacking.',
    badge: 'Best Seller',
    rating: 4.7,
    reviewCount: 210,
    stock: 150,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
    isBestseller: true,
  },
  {
    productName: 'California Almonds (250g)',
    brandName: 'STM Premium',
    category: 'Dry Fruits',
    subcategory: 'Nuts',
    productImage: [
      'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400&q=80',
    ],
    price: 280,
    selling: 239,
    description: 'Raw California almonds — a daily dose of Vitamin E, healthy fats and protein.',
    badge: 'Best Seller',
    rating: 4.6,
    reviewCount: 185,
    stock: 200,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
  },
  {
    productName: 'Afghan Raisins Kishmish (250g)',
    brandName: 'STM Premium',
    category: 'Dry Fruits',
    subcategory: 'Dried Fruits',
    productImage: [
      'https://images.unsplash.com/photo-1596591607607-b2ae01e6c1f9?w=400&q=80',
    ],
    price: 180,
    selling: 149,
    description: 'Sweet golden Afghan raisins — excellent source of iron and natural sugars.',
    rating: 4.3,
    reviewCount: 78,
    stock: 180,
    isAvailable: true,
  },
  {
    productName: 'Medjool Dates (250g)',
    brandName: 'STM Premium',
    category: 'Dry Fruits',
    subcategory: 'Dates',
    productImage: [
      'https://images.unsplash.com/photo-1574226516831-e1dff420e562?w=400&q=80',
    ],
    price: 350,
    selling: 299,
    description: 'Premium Medjool dates — naturally sweet, high in fiber and instant energy.',
    badge: 'New Arrival',
    rating: 4.8,
    reviewCount: 63,
    stock: 100,
    isAvailable: true,
    isTrending: true,
  },
  {
    productName: 'Walnut Kernels (200g)',
    brandName: 'STM Premium',
    category: 'Dry Fruits',
    subcategory: 'Nuts',
    productImage: [
      'https://images.unsplash.com/photo-1600428853876-fb6a4f3eed27?w=400&q=80',
    ],
    price: 420,
    selling: 369,
    description: 'Kashmiri walnut kernels — brain food packed with Omega-3 fatty acids.',
    rating: 4.5,
    reviewCount: 92,
    stock: 80,
    isAvailable: true,
  },

  // ═══════════════════ CAKES ═══════════════════
  {
    productName: 'Chocolate Truffle Birthday Cake (500g)',
    brandName: 'STM Bakery',
    category: 'Cakes',
    subcategory: 'Birthday Cakes',
    productImage: [
      'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400&q=80',
      'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&q=80',
    ],
    price: 750,
    selling: 599,
    description: 'Rich chocolate truffle cake with ganache frosting. Perfect for birthdays — made fresh on order.',
    badge: 'Best Seller',
    rating: 4.9,
    reviewCount: 145,
    stock: 30,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
    isBestseller: true,
  },
  {
    productName: 'Strawberry Cream Cake (500g)',
    brandName: 'STM Bakery',
    category: 'Cakes',
    subcategory: 'Birthday Cakes',
    productImage: [
      'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400&q=80',
    ],
    price: 700,
    selling: 549,
    description: 'Fresh strawberry cream cake with real fruit slices. Light, creamy and absolutely delicious.',
    badge: 'New Arrival',
    rating: 4.7,
    reviewCount: 89,
    stock: 25,
    isAvailable: true,
    isTrending: true,
  },
  {
    productName: 'Black Forest Cake (1 kg)',
    brandName: 'STM Bakery',
    category: 'Cakes',
    subcategory: 'Birthday Cakes',
    productImage: [
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80',
    ],
    price: 1200,
    selling: 999,
    description: 'Classic black forest cake with cherries, whipped cream and chocolate shavings. Party favorite!',
    rating: 4.8,
    reviewCount: 201,
    stock: 20,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
  },
  {
    productName: 'Mango Cream Cake (500g)',
    brandName: 'STM Bakery',
    category: 'Cakes',
    subcategory: 'Seasonal Cakes',
    productImage: [
      'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&q=80',
    ],
    price: 750,
    selling: 599,
    description: 'Made with fresh Alphonso mango pulp and light cream. A summer special treat!',
    badge: 'New Arrival',
    rating: 4.6,
    reviewCount: 54,
    stock: 15,
    isAvailable: true,
  },

  // ═══════════════════ BIRTHDAY CELEBRATION COLLECTION ═══════════════════
  {
    productName: 'Birthday Celebration Hamper (Deluxe)',
    brandName: 'STM Gifts',
    category: 'Birthday Celebration Collection',
    subcategory: 'Gift Hampers',
    productImage: [
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&q=80',
    ],
    price: 1500,
    selling: 1199,
    description: 'Luxurious birthday hamper with premium dry fruits, chocolates and a birthday card. Perfect gift for loved ones.',
    badge: 'Best Seller',
    rating: 4.9,
    reviewCount: 78,
    stock: 40,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
  },
  {
    productName: 'Mixed Dry Fruit Gift Box (500g)',
    brandName: 'STM Gifts',
    category: 'Birthday Celebration Collection',
    subcategory: 'Gift Boxes',
    productImage: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
    ],
    price: 900,
    selling: 749,
    description: 'Premium mixed dry fruits in a beautiful gift box. Includes almonds, cashews, dates and walnuts.',
    rating: 4.7,
    reviewCount: 55,
    stock: 60,
    isAvailable: true,
    isTrending: true,
  },
  {
    productName: 'Birthday Cake + Fruit Basket Combo',
    brandName: 'STM Gifts',
    category: 'Birthday Celebration Collection',
    subcategory: 'Combos',
    productImage: [
      'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&q=80',
    ],
    price: 1800,
    selling: 1449,
    description: 'Birthday combo: 500g chocolate cake + a beautiful fruit basket with 6 seasonal fruits. Free birthday message card!',
    badge: 'Best Seller',
    rating: 4.8,
    reviewCount: 102,
    stock: 20,
    isAvailable: true,
    isTrending: true,
    isFeatured: true,
  },

  // ═══════════════════ FRUIT JUICE ═══════════════════
  {
    productName: 'Fresh Orange Juice (1L)',
    brandName: 'STM Fresh',
    category: 'Fruit Juice',
    subcategory: 'Cold Press Juices',
    productImage: [
      'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&q=80',
    ],
    price: 150,
    selling: 120,
    description: 'Cold-pressed fresh orange juice — no preservatives, no added sugar. Pure natural goodness.',
    badge: 'New Arrival',
    rating: 4.5,
    reviewCount: 67,
    stock: 50,
    isAvailable: true,
    isTrending: true,
  },
  {
    productName: 'Pomegranate Juice (500ml)',
    brandName: 'STM Fresh',
    category: 'Fruit Juice',
    subcategory: 'Cold Press Juices',
    productImage: [
      'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=80',
    ],
    price: 200,
    selling: 169,
    description: 'Fresh pomegranate juice — great for anemia, heart health and boosting hemoglobin.',
    rating: 4.7,
    reviewCount: 89,
    stock: 40,
    isAvailable: true,
    isTrending: true,
  },
];

// ── Banners ───────────────────────────────────────────────────────────────────
const BANNERS_DATA = [
  {
    title: 'Fresh Fruits & Dry Fruits',
    description: 'Farm fresh, handpicked. Delivered to your door.',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=1200&q=85',
    link: '/product-category?category=Fruits',
    isActive: true,
    order: 1,
  },
  {
    title: 'Birthday Cakes — Order Now',
    description: 'Custom cakes made fresh. Same-day delivery available.',
    image: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=1200&q=85',
    link: '/product-category?category=Cakes',
    isActive: true,
    order: 2,
  },
  {
    title: 'Premium Dry Fruits Collection',
    description: 'California almonds, Afghan raisins, Medjool dates & more.',
    image: 'https://images.unsplash.com/photo-1563412886265-c3cb62f1fdc0?w=1200&q=85',
    link: '/product-category?category=Dry Fruits',
    isActive: true,
    order: 3,
  },
];

// ── Seed Function ─────────────────────────────────────────────────────────────
async function seedData() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    // ── Seed Products ──────────────────────────────────────────────────────
    const existingCount = await productModel.countDocuments();
    console.log(`📦 Existing products: ${existingCount}`);

    let added = 0;
    for (const product of PRODUCTS) {
      const exists = await productModel.findOne({
        productName: product.productName,
      });

      if (!exists) {
        await productModel.create(product);
        console.log(`  ✅ Added: ${product.productName}`);
        added++;
      } else {
        console.log(`  ⏭️  Skipped (already exists): ${product.productName}`);
      }
    }

    console.log(`\n🎉 Products seeded! Added ${added} new products.\n`);

    // ── Seed Banners ───────────────────────────────────────────────────────
    try {
      const bannerModel = require('../models/bannerModel');
      const existingBanners = await bannerModel.countDocuments();
      console.log(`🖼️  Existing banners: ${existingBanners}`);

      let bannersAdded = 0;
      for (const banner of BANNERS_DATA) {
        const exists = await bannerModel.findOne({ title: banner.title });
        if (!exists) {
          await bannerModel.create(banner);
          console.log(`  ✅ Banner added: ${banner.title}`);
          bannersAdded++;
        } else {
          console.log(`  ⏭️  Banner skipped: ${banner.title}`);
        }
      }
      console.log(`\n🎉 Banners seeded! Added ${bannersAdded} new banners.`);
    } catch (bannerErr) {
      console.log('⚠️  Banner model not found or error:', bannerErr.message);
      console.log('   Skipping banners. Add them manually via Admin Panel → Banners.');
    }

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seedData();
