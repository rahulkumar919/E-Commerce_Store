/**
 * Seed script — Categories, Subcategories & Products
 * Run: node scripts/seedCategoriesAndProducts.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const connectDB = require("../config/db");

// ─── Unique product images — every product gets its own photo ────────────────
const IMGS = {
  // Fruits
  mango:        "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400",
  mango2:       "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400",
  banana:       "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
  apple:        "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400",
  apple2:       "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
  apple3:       "https://images.unsplash.com/photo-1528825871115-3581a5387919?w=400",
  orange:       "https://images.unsplash.com/photo-1580052614034-c55d20bfee3b?w=400",
  orange2:      "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab12?w=400",
  grape:        "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400",
  grape2:       "https://images.unsplash.com/photo-1423483641154-5411ec9c0ddf?w=400",
  kiwi:         "https://images.unsplash.com/photo-1618897996318-5a901fa6ca71?w=400",
  papaya:       "https://images.unsplash.com/photo-1594933757-9aeadcbf3cfe?w=400",
  pineapple:    "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=400",
  lemon:        "https://images.unsplash.com/photo-1590502160462-58b41354f588?w=400",
  mosambi:      "https://images.unsplash.com/photo-1558818498-28c1e002b655?w=400",
  guava:        "https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400",
  strawberry:   "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400",
  blueberry:    "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400",
  jamun:        "https://images.unsplash.com/photo-1601900456367-c2c64869d5de?w=400",
  watermelon:   "https://images.unsplash.com/photo-1563114773-84221bd62daa?w=400",
  pear:         "https://images.unsplash.com/photo-1561155707-450f73b5b6ee?w=400",
  // Dry Fruits
  almond:       "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400",
  cashew:       "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400",
  walnut:       "https://images.unsplash.com/photo-1563136919-de33ca07eb48?w=400",
  pistachio:    "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400",
  raisin:       "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?w=400",
  dates:        "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400",
  fig:          "https://images.unsplash.com/photo-1601493700874-adcf9bfe1fa0?w=400",
  cranberry:    "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=400",
  apricot:      "https://images.unsplash.com/photo-1597226051193-0e66e4d4b5d3?w=400",
  mixnuts:      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
  trailmix:     "https://images.unsplash.com/photo-1604671368394-2240d0b1bb6c?w=400",
  dryfruitmix:  "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400",
  // Juices
  ojuice:       "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400",
  wjuice:       "https://images.unsplash.com/photo-1520200656987-0da6a5ab2041?w=400",
  pjuice:       "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
  mjuice:       "https://images.unsplash.com/photo-1576673442511-7e39b6545c87?w=400",
  gjuice:       "https://images.unsplash.com/photo-1619531040576-f9416740661b?w=400",
  amlajuice:    "https://images.unsplash.com/photo-1638176066959-2a8a0e9a3b5e?w=400",
  aloejuice:    "https://images.unsplash.com/photo-1622597467836-f3e7af4a0e80?w=400",
  karelaJuice:  "https://images.unsplash.com/photo-1571781565036-d3f759be73e4?w=400",
  citrusmix:    "https://images.unsplash.com/photo-1506802913710-d8b36e95ea24?w=400",
  berrymix:     "https://images.unsplash.com/photo-1614088686580-e2309aab1741?w=400",
  smoothie:     "https://images.unsplash.com/photo-1553530666-ba11a90a3eff?w=400",
  smoothie2:    "https://images.unsplash.com/photo-1638176066959-2a8a0e9a3b5e?w=400",
  smoothie3:    "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400",
  smoothie4:    "https://images.unsplash.com/photo-1505252585461-04db1eb84625?w=400",
  // Cakes
  cake_vanilla: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
  cake_choco:   "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
  cake_rainbow: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400",
  cake_fruit:   "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=400",
  cake_lava:    "https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=400",
  cake_white:   "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=400",
  cake_belgian: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400",
  cake_straw:   "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400",
  cake_mango:   "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400",
  cake_kiwi:    "https://images.unsplash.com/photo-1549312370-3c3a81413820?w=400",
  cake_red:     "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400",
  cake_bforest: "https://images.unsplash.com/photo-1611293388250-580b08c4a145?w=400",
  cake_butter:  "https://images.unsplash.com/photo-1542691457-cbe4df041eb2?w=400",
  cake_pine:    "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
  // Birthday
  hamper1:      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400",
  hamper2:      "https://images.unsplash.com/photo-1607469256872-a6e2bffd0e83?w=400",
  hamper3:      "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400",
  hamper4:      "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=400",
  balloon:      "https://images.unsplash.com/photo-1523301343968-6a6ebf63c672?w=400",
  balloon2:     "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400",
  banner:       "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400",
  partykit:     "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=400",
  gift1:        "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400",
  gift2:        "https://images.unsplash.com/photo-1607469256872-a6e2bffd0e83?w=400",
  gift3:        "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=400",
  gift4:        "https://images.unsplash.com/photo-1607609127857-af11b83edea8?w=400",
  combo1:       "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400",
  combo2:       "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400",
  combo3:       "https://images.unsplash.com/photo-1587888637140-849541b3b054?w=400",
  combo4:       "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400",
};

// ─── Category & subcategory structure ────────────────────────────────────────
const CATEGORY_TREE = [
  {
    name: "Fruits", slug: "fruits", sortOrder: 1, image: IMGS.mango,
    subcategories: [
      { name: "Tropical Fruits",  slug: "tropical-fruits",  sortOrder: 1, image: IMGS.mango },
      { name: "Citrus Fruits",    slug: "citrus-fruits",    sortOrder: 2, image: IMGS.orange },
      { name: "Berries",          slug: "berries",          sortOrder: 3, image: IMGS.strawberry },
      { name: "Seasonal Fruits",  slug: "seasonal-fruits",  sortOrder: 4, image: IMGS.apple },
    ]
  },
  {
    name: "Dry Fruits", slug: "dry-fruits", sortOrder: 2, image: IMGS.almond,
    subcategories: [
      { name: "Nuts",               slug: "nuts",               sortOrder: 1, image: IMGS.almond },
      { name: "Dried Berries",      slug: "dried-berries",      sortOrder: 2, image: IMGS.raisin },
      { name: "Premium Dry Fruits", slug: "premium-dry-fruits", sortOrder: 3, image: IMGS.walnut },
      { name: "Mixed Dry Fruits",   slug: "mixed-dry-fruits",   sortOrder: 4, image: IMGS.mixnuts },
    ]
  },
  {
    name: "Fruit Juice", slug: "fruit-juice", sortOrder: 3, image: IMGS.ojuice,
    subcategories: [
      { name: "Fresh Juices",  slug: "fresh-juices",  sortOrder: 1, image: IMGS.ojuice },
      { name: "Health Juices", slug: "health-juices", sortOrder: 2, image: IMGS.gjuice },
      { name: "Mixed Juices",  slug: "mixed-juices",  sortOrder: 3, image: IMGS.mjuice },
      { name: "Smoothies",     slug: "smoothies",     sortOrder: 4, image: IMGS.smoothie },
    ]
  },
  {
    name: "Cakes", slug: "cakes", sortOrder: 4, image: IMGS.cake_vanilla,
    subcategories: [
      { name: "Birthday Cakes",  slug: "birthday-cakes",  sortOrder: 1, image: IMGS.cake_vanilla },
      { name: "Chocolate Cakes", slug: "chocolate-cakes", sortOrder: 2, image: IMGS.cake_choco },
      { name: "Fruit Cakes",     slug: "fruit-cakes",     sortOrder: 3, image: IMGS.cake_fruit },
      { name: "Special Cakes",   slug: "special-cakes",   sortOrder: 4, image: IMGS.cake_red },
    ]
  },
  {
    name: "Birthday", slug: "birthday", sortOrder: 5, image: IMGS.hamper1,
    subcategories: [
      { name: "Birthday Hampers",  slug: "birthday-hampers",  sortOrder: 1, image: IMGS.hamper1 },
      { name: "Party Decorations", slug: "party-decorations", sortOrder: 2, image: IMGS.balloon },
      { name: "Gift Baskets",      slug: "gift-baskets",      sortOrder: 3, image: IMGS.gift1 },
      { name: "Birthday Combos",   slug: "birthday-combos",   sortOrder: 4, image: IMGS.combo1 },
    ]
  },
];

// ─── Products per subcategory — every product has a unique image ─────────────
const PRODUCTS_MAP = {
  // FRUITS — 4 products each, all unique images
  "Tropical Fruits": [
    { productName: "Alphonso Mango (Ratnagiri)", price: 600, selling: 499, img: IMGS.mango, badge: "Best Seller" },
    { productName: "Papaya (Fresh)", price: 80, selling: 60, img: IMGS.papaya },
    { productName: "Pineapple", price: 120, selling: 95, img: IMGS.pineapple },
    { productName: "Kiwi (Imported)", price: 350, selling: 280, img: IMGS.kiwi, badge: "New Arrival" },
  ],
  "Citrus Fruits": [
    { productName: "Fresh Orange (Nagpur)", price: 120, selling: 90, img: IMGS.orange, badge: "Best Seller" },
    { productName: "Lemon (Nimbu)", price: 60, selling: 45, img: IMGS.lemon },
    { productName: "Mosambi (Sweet Lime)", price: 100, selling: 80, img: IMGS.mosambi },
    { productName: "Grapes (Green Seedless)", price: 200, selling: 160, img: IMGS.grape, badge: "New Arrival" },
  ],
  "Berries": [
    { productName: "Strawberry (Fresh)", price: 400, selling: 320, img: IMGS.strawberry, badge: "New Arrival" },
    { productName: "Blueberry (Imported)", price: 600, selling: 480, img: IMGS.blueberry },
    { productName: "Jamun (Indian Blackberry)", price: 200, selling: 160, img: IMGS.jamun },
    { productName: "Guava (Amrood)", price: 80, selling: 60, img: IMGS.guava, badge: "Best Seller" },
  ],
  "Seasonal Fruits": [
    { productName: "Red Apple (Shimla)", price: 220, selling: 179, img: IMGS.apple, badge: "Best Seller" },
    { productName: "Green Apple (Granny Smith)", price: 280, selling: 220, img: IMGS.apple2 },
    { productName: "Watermelon (Tarbooj)", price: 40, selling: 30, img: IMGS.watermelon },
    { productName: "Pear (Nashpati)", price: 160, selling: 130, img: IMGS.pear, badge: "New Arrival" },
  ],
};

// DRY FRUITS — 4 products each, all unique images
PRODUCTS_MAP["Nuts"] = [
  { productName: "Badam (Almonds) Premium", price: 1200, selling: 999, img: IMGS.almond, badge: "Best Seller" },
  { productName: "Kaju (Cashew W240)", price: 900, selling: 750, img: IMGS.cashew },
  { productName: "Akhrot (Walnut Kernels)", price: 800, selling: 650, img: IMGS.walnut },
  { productName: "Pista (Pistachios)", price: 1400, selling: 1150, img: IMGS.pistachio, badge: "New Arrival" },
];
PRODUCTS_MAP["Dried Berries"] = [
  { productName: "Kishmish (Raisins) Green", price: 400, selling: 320, img: IMGS.raisin },
  { productName: "Anjeer (Dried Figs)", price: 600, selling: 480, img: IMGS.fig },
  { productName: "Dried Cranberries", price: 500, selling: 400, img: IMGS.cranberry, badge: "New Arrival" },
  { productName: "Khajoor (Dates - Medjool)", price: 800, selling: 650, img: IMGS.dates, badge: "Best Seller" },
];
PRODUCTS_MAP["Premium Dry Fruits"] = [
  { productName: "Saffron Dry Fruits Mix (500g)", price: 1800, selling: 1499, img: IMGS.dryfruitmix, badge: "Best Seller" },
  { productName: "Irani Pista Premium", price: 1600, selling: 1299, img: IMGS.pistachio },
  { productName: "California Almond Premium", price: 1400, selling: 1150, img: "https://images.unsplash.com/photo-1570825461393-0daa7a1c3e6c?w=400" },
  { productName: "Afghan Dry Fruits Box", price: 2200, selling: 1799, img: "https://images.unsplash.com/photo-1606923829579-0cb981a83e2e?w=400", badge: "New Arrival" },
];
PRODUCTS_MAP["Mixed Dry Fruits"] = [
  { productName: "Mixed Dry Fruits (250g)", price: 600, selling: 480, img: IMGS.mixnuts },
  { productName: "Trail Mix (500g)", price: 800, selling: 650, img: IMGS.trailmix },
  { productName: "Festival Gift Pack (1kg)", price: 1500, selling: 1199, img: "https://images.unsplash.com/photo-1576773588543-8b4db52ebe99?w=400", badge: "Best Seller" },
  { productName: "Healthy Snack Mix", price: 500, selling: 399, img: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400", badge: "New Arrival" },
];

// FRUIT JUICE — 4 products each, all unique images
PRODUCTS_MAP["Fresh Juices"] = [
  { productName: "Fresh Orange Juice (500ml)", price: 150, selling: 119, img: IMGS.ojuice, badge: "Best Seller" },
  { productName: "Watermelon Juice (500ml)", price: 120, selling: 95, img: IMGS.wjuice },
  { productName: "Pineapple Juice (500ml)", price: 160, selling: 130, img: IMGS.pjuice },
  { productName: "Mixed Fruit Juice (500ml)", price: 180, selling: 149, img: IMGS.mjuice, badge: "New Arrival" },
];
PRODUCTS_MAP["Health Juices"] = [
  { productName: "Wheatgrass Juice (250ml)", price: 200, selling: 160, img: IMGS.gjuice, badge: "Best Seller" },
  { productName: "Amla Juice (500ml)", price: 180, selling: 145, img: IMGS.amlajuice },
  { productName: "Aloe Vera Juice (500ml)", price: 220, selling: 179, img: IMGS.aloejuice },
  { productName: "Karela-Amla Juice (500ml)", price: 190, selling: 155, img: IMGS.karelaJuice, badge: "New Arrival" },
];
PRODUCTS_MAP["Mixed Juices"] = [
  { productName: "Mango Pineapple Blend (500ml)", price: 200, selling: 160, img: IMGS.mjuice, badge: "Best Seller" },
  { productName: "Citrus Burst Mix (500ml)", price: 180, selling: 145, img: IMGS.citrusmix },
  { productName: "Tropical Medley Juice (500ml)", price: 220, selling: 179, img: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=400" },
  { productName: "Berry Blast Mix (500ml)", price: 250, selling: 199, img: IMGS.berrymix, badge: "New Arrival" },
];
PRODUCTS_MAP["Smoothies"] = [
  { productName: "Mango Smoothie (350ml)", price: 220, selling: 179, img: IMGS.smoothie, badge: "Best Seller" },
  { productName: "Strawberry Banana Smoothie (350ml)", price: 240, selling: 195, img: IMGS.smoothie2 },
  { productName: "Green Detox Smoothie (350ml)", price: 260, selling: 210, img: IMGS.smoothie3, badge: "New Arrival" },
  { productName: "Mixed Berry Smoothie (350ml)", price: 250, selling: 199, img: IMGS.smoothie4 },
];

// CAKES — 4 products each, all unique images
PRODUCTS_MAP["Birthday Cakes"] = [
  { productName: "Classic Vanilla Birthday Cake (1kg)", price: 800, selling: 649, img: IMGS.cake_vanilla, badge: "Best Seller" },
  { productName: "Chocolate Birthday Cake (1kg)", price: 900, selling: 749, img: IMGS.cake_choco },
  { productName: "Rainbow Sprinkle Birthday Cake (1kg)", price: 1000, selling: 849, img: IMGS.cake_rainbow, badge: "New Arrival" },
  { productName: "Fruit Cream Birthday Cake (1kg)", price: 950, selling: 799, img: IMGS.cake_fruit },
];
PRODUCTS_MAP["Chocolate Cakes"] = [
  { productName: "Dark Chocolate Truffle Cake (1kg)", price: 1100, selling: 899, img: IMGS.cake_choco, badge: "Best Seller" },
  { productName: "Choco Lava Cake (500g)", price: 650, selling: 519, img: IMGS.cake_lava },
  { productName: "White Chocolate Mousse Cake (1kg)", price: 1200, selling: 999, img: IMGS.cake_white, badge: "New Arrival" },
  { productName: "Belgian Chocolate Cake (1kg)", price: 1300, selling: 1049, img: IMGS.cake_belgian },
];
PRODUCTS_MAP["Fruit Cakes"] = [
  { productName: "Fresh Strawberry Cake (1kg)", price: 1000, selling: 829, img: IMGS.cake_straw, badge: "Best Seller" },
  { productName: "Mango Cream Cake (1kg)", price: 950, selling: 799, img: IMGS.cake_mango },
  { productName: "Mixed Fruit Cake (1kg)", price: 900, selling: 749, img: IMGS.cake_fruit, badge: "New Arrival" },
  { productName: "Kiwi Pineapple Cake (1kg)", price: 1050, selling: 879, img: IMGS.cake_kiwi },
];
PRODUCTS_MAP["Special Cakes"] = [
  { productName: "Red Velvet Cake (1kg)", price: 1200, selling: 999, img: IMGS.cake_red, badge: "Best Seller" },
  { productName: "Black Forest Cake (1kg)", price: 1100, selling: 899, img: IMGS.cake_bforest },
  { productName: "Butterscotch Cake (1kg)", price: 950, selling: 779, img: IMGS.cake_butter, badge: "New Arrival" },
  { productName: "Pineapple Pastry Cake (1kg)", price: 900, selling: 749, img: IMGS.cake_pine },
];

// BIRTHDAY — 4 products each, all unique images
PRODUCTS_MAP["Birthday Hampers"] = [
  { productName: "Premium Birthday Hamper (Dry Fruits + Chocolates)", price: 1500, selling: 1199, img: IMGS.hamper1, badge: "Best Seller" },
  { productName: "Fruit & Nut Birthday Hamper", price: 1200, selling: 999, img: IMGS.hamper2 },
  { productName: "Sweet Celebration Hamper", price: 1800, selling: 1499, img: IMGS.hamper3, badge: "New Arrival" },
  { productName: "Birthday Luxury Hamper Box", price: 2500, selling: 1999, img: IMGS.hamper4 },
];
PRODUCTS_MAP["Party Decorations"] = [
  { productName: "Birthday Balloon Bouquet (Pack of 20)", price: 400, selling: 299, img: IMGS.balloon, badge: "Best Seller" },
  { productName: "Happy Birthday Banner & Bunting Set", price: 350, selling: 249, img: IMGS.banner },
  { productName: "Party Decoration Combo Kit", price: 600, selling: 449, img: IMGS.partykit, badge: "New Arrival" },
  { productName: "Gold & Silver Foil Balloons (Pack of 10)", price: 500, selling: 379, img: IMGS.balloon2 },
];
PRODUCTS_MAP["Gift Baskets"] = [
  { productName: "Fruit Gift Basket (Assorted Fresh Fruits)", price: 800, selling: 649, img: IMGS.gift1, badge: "Best Seller" },
  { productName: "Dry Fruits Gift Basket (500g)", price: 1000, selling: 799, img: IMGS.gift2 },
  { productName: "Chocolate & Fruit Gift Basket", price: 1200, selling: 999, img: IMGS.gift3, badge: "New Arrival" },
  { productName: "Personalized Birthday Gift Basket", price: 1500, selling: 1199, img: IMGS.gift4 },
];
PRODUCTS_MAP["Birthday Combos"] = [
  { productName: "Cake + Balloon Combo", price: 1200, selling: 999, img: IMGS.combo1, badge: "Best Seller" },
  { productName: "Cake + Hamper Combo", price: 2000, selling: 1649, img: IMGS.combo2 },
  { productName: "Full Birthday Party Combo (Cake + Deco + Hamper)", price: 3000, selling: 2499, img: IMGS.combo3, badge: "New Arrival" },
  { productName: "Mini Birthday Combo (Cupcakes + Balloons)", price: 800, selling: 649, img: IMGS.combo4 },
];

// ─── Main seed function ───────────────────────────────────────────────────────
async function seed() {
  await connectDB();
  console.log("✅ Connected to MongoDB");

  // Clear existing data
  await Promise.all([
    require("../models/categoryModel").deleteMany({}),
    require("../models/productModel").deleteMany({}),
  ]);
  console.log("🗑️  Cleared existing categories and products");

  let totalProducts = 0;

  for (const cat of CATEGORY_TREE) {
    // Create parent category
    const parentDoc = await require("../models/categoryModel").create({
      name: cat.name,
      slug: cat.slug,
      sortOrder: cat.sortOrder,
      image: cat.image,
      isActive: true,
      showInNavbar: true,
    });
    console.log(`📁 Created category: ${cat.name}`);

    for (const sub of cat.subcategories) {
      // Create subcategory
      const subDoc = await require("../models/categoryModel").create({
        name: sub.name,
        slug: sub.slug,
        sortOrder: sub.sortOrder,
        image: sub.image,
        parentCategory: parentDoc._id,
        isActive: true,
        showInNavbar: true,
      });
      console.log(`   📂 Created subcategory: ${sub.name}`);

      // Create products for this subcategory
      const products = PRODUCTS_MAP[sub.name] || [];
      for (const p of products) {
        await require("../models/productModel").create({
          productName: p.productName,
          category: cat.name,
          subcategory: sub.name,
          productImage: [p.img],
          price: p.price,
          selling: p.selling,
          badge: p.badge || "",
          stock: 50,
          isAvailable: true,
          isBestseller: p.badge === "Best Seller",
          isNewArrival: p.badge === "New Arrival",
          isTrending: p.badge === "Best Seller", // mark Best Sellers as trending
          rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
          reviewCount: Math.floor(Math.random() * 200) + 10,
        });
        totalProducts++;
      }
      console.log(`      ✅ Added ${products.length} products to "${sub.name}"`);
    }
  }

  console.log(`\n🎉 Seeding complete! Total products inserted: ${totalProducts}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
