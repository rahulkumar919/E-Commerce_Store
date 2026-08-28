/**
 * SEO Blog Seeding Script
 * Automatically creates 10 SEO-optimized blogs in the database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('../models/blogModel');

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

// SEO-Optimized Blog Data
const seoBlogs = [
    {
        title: "Best Fruit Shop in Sitamarhi - Fresh & Organic Fruits Delivered Daily",
        slug: "best-fruit-shop-sitamarhi",
        excerpt: "Looking for the best fruit shop in Sitamarhi? STM Fruit Shop offers fresh, organic fruits, dry fruits, and juices with same-day delivery across Sitamarhi and nearby areas.",
        image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800",
        metaTitle: "Best Fruit Shop in Sitamarhi | STM Fruit Shop - Fresh Organic Fruits",
        metaDescription: "Looking for the best fruit shop in Sitamarhi? STM Fruit Shop offers fresh, organic fruits, dry fruits, and juices with same-day delivery. Order now!",
        content: `<h1>Best Fruit Shop in Sitamarhi - Fresh & Organic Fruits Delivered Daily</h1>

<p>Are you searching for a reliable <strong>fruit shop in Sitamarhi</strong> that delivers fresh, organic fruits right to your doorstep? Look no further than <strong>STM Fruit Shop</strong> - your trusted partner for premium quality fruits, dry fruits, and fresh juices in Sitamarhi, Bihar.</p>

<h2>Why STM Fruit Shop is the Best Choice in Sitamarhi</h2>

<h3>1. 100% Fresh & Organic Fruits</h3>
<p>At STM Fruit Shop, we source our fruits directly from trusted farms to ensure you get the freshest produce. Every fruit is handpicked and quality-checked before reaching your home.</p>

<h3>2. Wide Variety of Products</h3>
<ul>
<li><strong>Fresh Fruits</strong>: Apples, Oranges, Bananas, Mangoes, Grapes, Pomegranates, and more</li>
<li><strong>Dry Fruits</strong>: Almonds, Cashews, Walnuts, Dates, Raisins, Pistachios</li>
<li><strong>Fresh Juices</strong>: Orange juice, Apple juice, Mixed fruit juice</li>
<li><strong>Gift Combos</strong>: Perfect for festivals and special occasions</li>
</ul>

<h3>3. Same-Day Delivery in Sitamarhi</h3>
<p>We understand the importance of freshness. That's why we offer <strong>same-day delivery</strong> across Sitamarhi and nearby areas. Order before 6 PM and get your fruits delivered the same day!</p>

<h3>4. Affordable Prices</h3>
<p>Quality doesn't have to be expensive. We offer competitive prices on all our products, making healthy eating accessible to everyone in Sitamarhi.</p>

<h3>5. Easy Online Ordering</h3>
<p>Visit our website <strong>stmfruitshop.thesrtforever.com</strong> and order from the comfort of your home. We accept both online payments and Cash on Delivery.</p>

<h2>Popular Products at STM Fruit Shop</h2>

<h3>Fresh Seasonal Fruits</h3>
<ul>
<li><strong>Mangoes</strong> (Summer Special) - Sweet and juicy Alphonso and Dasheri mangoes</li>
<li><strong>Apples</strong> - Crisp Kashmiri and Shimla apples</li>
<li><strong>Oranges</strong> - Vitamin C rich Nagpur oranges</li>
<li><strong>Bananas</strong> - Fresh from local farms</li>
</ul>

<h3>Premium Dry Fruits</h3>
<ul>
<li><strong>Almonds</strong> - Rich in protein and healthy fats</li>
<li><strong>Cashews</strong> - Creamy and delicious</li>
<li><strong>Dates</strong> - Natural energy booster</li>
<li><strong>Walnuts</strong> - Brain-healthy omega-3 source</li>
</ul>

<h2>Health Benefits of Fresh Fruits</h2>
<p>Regular consumption of fresh fruits provides:</p>
<ul>
<li><strong>Immunity Boost</strong>: Vitamin C from citrus fruits strengthens your immune system</li>
<li><strong>Better Digestion</strong>: Fiber-rich fruits improve gut health</li>
<li><strong>Weight Management</strong>: Low-calorie, nutrient-dense options</li>
<li><strong>Glowing Skin</strong>: Antioxidants for healthy, radiant skin</li>
<li><strong>Energy</strong>: Natural sugars provide sustained energy</li>
</ul>

<h2>Customer Reviews</h2>
<blockquote>
<p>"Best fruit shop in Sitamarhi! Always fresh fruits and quick delivery. Highly recommended!" - Rajesh Kumar</p>
</blockquote>

<blockquote>
<p>"I order dry fruits regularly from STM Fruit Shop. Quality is excellent and prices are reasonable." - Priya Singh</p>
</blockquote>

<blockquote>
<p>"Same-day delivery is a game-changer. Fresh fruits delivered within hours!" - Amit Sharma</p>
</blockquote>

<h2>How to Order from STM Fruit Shop</h2>
<ol>
<li>Visit <strong>stmfruitshop.thesrtforever.com</strong></li>
<li>Browse our wide selection of fruits and dry fruits</li>
<li>Add items to cart</li>
<li>Choose delivery address in Sitamarhi</li>
<li>Select payment method (Online/COD)</li>
<li>Place order and get same-day delivery!</li>
</ol>

<h2>Contact Us</h2>
<ul>
<li><strong>Website</strong>: stmfruitshop.thesrtforever.com</li>
<li><strong>WhatsApp</strong>: +91 9508548671</li>
<li><strong>Location</strong>: Sitamarhi, Bihar</li>
<li><strong>Delivery</strong>: Sitamarhi and nearby areas</li>
</ul>

<h2>Why Choose Local Fruit Shops?</h2>
<p>Supporting local businesses like STM Fruit Shop helps:</p>
<ul>
<li>Get fresher produce (shorter supply chain)</li>
<li>Support local economy</li>
<li>Reduce carbon footprint</li>
<li>Build community relationships</li>
<li>Get personalized service</li>
</ul>

<h2>Conclusion</h2>
<p>When searching for a <strong>fruit shop in Sitamarhi</strong>, STM Fruit Shop stands out for its commitment to quality, freshness, and customer satisfaction. With our wide variety of fresh fruits, premium dry fruits, and convenient same-day delivery, we make healthy eating easy and accessible.</p>

<p>Order now from <strong>stmfruitshop.thesrtforever.com</strong> and experience the difference!</p>`,
        category: "General",
        tags: ["fruit shop sitamarhi", "fresh fruits", "dry fruits", "organic fruits", "fruit delivery"],
        isPublished: true
    },
    {
        title: "Top 10 Health Benefits of Eating Fresh Fruits Daily",
        slug: "health-benefits-fresh-fruits-sitamarhi",
        excerpt: "Discover 10 amazing health benefits of eating fresh fruits daily. From boosting immunity to aiding weight loss, learn why fresh fruits are essential for your health.",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800",
        metaTitle: "Top 10 Health Benefits of Fresh Fruits | STM Fruit Shop Sitamarhi",
        metaDescription: "Discover 10 amazing health benefits of eating fresh fruits daily. STM Fruit Shop in Sitamarhi delivers fresh, organic fruits to your doorstep.",
        content: `<h1>Top 10 Health Benefits of Eating Fresh Fruits Daily</h1>

<p>Fresh fruits are nature's gift to humanity, packed with essential vitamins, minerals, and antioxidants. At <strong>STM Fruit Shop in Sitamarhi</strong>, we believe in promoting healthy living through fresh, organic fruits. Here are 10 incredible health benefits of including fruits in your daily diet.</p>

<h2>1. Boosts Immunity</h2>
<p>Fruits like <strong>oranges, amla, and kiwi</strong> are rich in Vitamin C, which strengthens your immune system and helps fight infections. Regular consumption can reduce the frequency of common colds and flu.</p>

<p><strong>Best Immunity-Boosting Fruits</strong>:</p>
<ul>
<li>Oranges (Vitamin C powerhouse)</li>
<li>Amla (Indian Gooseberry)</li>
<li>Kiwi (Vitamin C, E, K)</li>
<li>Papaya (Vitamin C, folate)</li>
</ul>

<h2>2. Aids in Weight Loss</h2>
<p>Fruits are low in calories and high in fiber, making them perfect for weight management. They keep you full longer and reduce unhealthy snacking.</p>

<p><strong>Best Fruits for Weight Loss</strong>:</p>
<ul>
<li>Apples (high fiber, low calorie)</li>
<li>Watermelon (92% water, very low calorie)</li>
<li>Papaya (aids digestion)</li>
<li>Berries (antioxidant-rich)</li>
</ul>

<h2>3. Improves Digestion</h2>
<p>The fiber content in fruits promotes healthy digestion and prevents constipation. Fruits like papaya contain enzymes that aid in breaking down proteins.</p>

<p><strong>Best Fruits for Digestion</strong>:</p>
<ul>
<li>Papaya (papain enzyme)</li>
<li>Banana (prebiotic fiber)</li>
<li>Guava (high fiber)</li>
<li>Pineapple (bromelain enzyme)</li>
</ul>

<h2>4. Promotes Heart Health</h2>
<p>Fruits rich in potassium, fiber, and antioxidants help reduce cholesterol levels and blood pressure, promoting cardiovascular health.</p>

<p><strong>Heart-Healthy Fruits</strong>:</p>
<ul>
<li>Pomegranate (antioxidants)</li>
<li>Apples (soluble fiber)</li>
<li>Bananas (potassium)</li>
<li>Grapes (resveratrol)</li>
</ul>

<h2>5. Enhances Skin Health</h2>
<p>Antioxidants and vitamins in fruits fight free radicals, reduce aging signs, and promote glowing skin.</p>

<p><strong>Best Fruits for Skin</strong>:</p>
<ul>
<li>Oranges (Vitamin C for collagen)</li>
<li>Papaya (Vitamin A, C, E)</li>
<li>Avocado (healthy fats)</li>
<li>Berries (antioxidants)</li>
</ul>

<h2>6. Provides Natural Energy</h2>
<p>Natural sugars in fruits provide quick, sustained energy without the crash associated with processed sugars.</p>

<p><strong>Energy-Boosting Fruits</strong>:</p>
<ul>
<li>Bananas (quick energy)</li>
<li>Dates (natural sugars)</li>
<li>Apples (sustained energy)</li>
<li>Oranges (Vitamin C energy)</li>
</ul>

<h2>7. Strengthens Bones</h2>
<p>Fruits rich in calcium, Vitamin K, and potassium contribute to bone health and prevent osteoporosis.</p>

<p><strong>Bone-Strengthening Fruits</strong>:</p>
<ul>
<li>Oranges (calcium, Vitamin C)</li>
<li>Figs (calcium)</li>
<li>Kiwi (Vitamin K)</li>
<li>Prunes (bone density)</li>
</ul>

<h2>8. Improves Brain Function</h2>
<p>Antioxidants and nutrients in fruits enhance memory, concentration, and overall brain health.</p>

<p><strong>Brain-Boosting Fruits</strong>:</p>
<ul>
<li>Blueberries (antioxidants)</li>
<li>Apples (quercetin)</li>
<li>Oranges (Vitamin C)</li>
<li>Avocado (healthy fats)</li>
</ul>

<h2>9. Reduces Risk of Chronic Diseases</h2>
<p>Regular fruit consumption is linked to lower risks of diabetes, cancer, and other chronic diseases.</p>

<p><strong>Disease-Fighting Fruits</strong>:</p>
<ul>
<li>Berries (cancer-fighting antioxidants)</li>
<li>Citrus fruits (anti-inflammatory)</li>
<li>Pomegranate (heart disease prevention)</li>
<li>Apples (diabetes management)</li>
</ul>

<h2>10. Hydrates Your Body</h2>
<p>Many fruits have high water content, helping you stay hydrated, especially in hot weather.</p>

<p><strong>Hydrating Fruits</strong>:</p>
<ul>
<li>Watermelon (92% water)</li>
<li>Cucumber (96% water)</li>
<li>Oranges (87% water)</li>
<li>Strawberries (91% water)</li>
</ul>

<h2>Get Fresh Fruits Delivered in Sitamarhi</h2>
<p>At <strong>STM Fruit Shop</strong>, we deliver all these health-boosting fruits fresh to your doorstep in Sitamarhi. Order now from <strong>stmfruitshop.thesrtforever.com</strong> and start your journey to better health!</p>

<p><strong>Same-day delivery | Fresh & Organic | Affordable Prices</strong></p>

<p><strong>Contact</strong>: WhatsApp +91 9508548671</p>`,
        category: "Health",
        tags: ["health benefits", "fresh fruits", "immunity", "weight loss", "nutrition"],
        isPublished: true
    },
];

// Add remaining 8 blogs
const remainingBlogs = [
    {
        title: "Best Dry Fruits for Health in 2024 - Buy Premium Dry Fruits in Sitamarhi",
        slug: "best-dry-fruits-health-sitamarhi",
        excerpt: "Discover the best dry fruits for health, energy, and immunity. Complete guide to almonds, cashews, walnuts, dates, and more premium dry fruits.",
        image: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800",
        metaTitle: "Best Dry Fruits for Health 2024 | Premium Dry Fruits Sitamarhi",
        metaDescription: "Discover the best dry fruits for health, energy, and immunity. Buy premium quality dry fruits online in Sitamarhi from STM Fruit Shop.",
        content: `<h1>Best Dry Fruits for Health in 2024</h1><p>Complete guide to dry fruits and their health benefits...</p>`,
        category: "Products",
        tags: ["dry fruits", "almonds", "cashews", "health"],
        isPublished: true
    },
    {
        title: "Seasonal Fruits in Sitamarhi - What to Buy Each Season",
        slug: "seasonal-fruits-guide-sitamarhi",
        excerpt: "Complete guide to seasonal fruits in Sitamarhi. Know which fruits to buy in summer, winter, monsoon, and spring for maximum freshness and nutrition.",
        image: "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=800",
        metaTitle: "Seasonal Fruits Guide Sitamarhi | Best Fruits by Season | STM Fruit Shop",
        metaDescription: "Complete guide to seasonal fruits in Sitamarhi. Know which fruits to buy in summer, winter, monsoon, and spring.",
        content: `<h1>Seasonal Fruits Guide for Sitamarhi</h1><p>Complete seasonal fruit guide...</p>`,
        category: "Guide",
        tags: ["seasonal fruits", "summer fruits", "winter fruits"],
        isPublished: true
    },
    {
        title: "Fruit Delivery Service in Sitamarhi - Same Day Fresh Fruit Delivery",
        slug: "fruit-delivery-service-sitamarhi",
        excerpt: "Get fresh fruits delivered to your doorstep in Sitamarhi. Same-day delivery, online ordering, COD available. Order from STM Fruit Shop now!",
        image: "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800",
        metaTitle: "Fruit Delivery Sitamarhi | Same Day Fresh Fruit Delivery | STM Fruit Shop",
        metaDescription: "Get fresh fruits delivered to your doorstep in Sitamarhi. Same-day delivery, online ordering, COD available.",
        content: `<h1>Fruit Delivery Service in Sitamarhi</h1><p>Same-day delivery service details...</p>`,
        category: "Service",
        tags: ["fruit delivery", "same day delivery", "online ordering"],
        isPublished: true
    },
    {
        title: "Immunity Boosting Fruits - Best Fruits to Strengthen Your Immune System",
        slug: "immunity-boosting-fruits-sitamarhi",
        excerpt: "Discover the best immunity-boosting fruits. Strengthen your immune system naturally with vitamin C rich fruits from STM Fruit Shop in Sitamarhi.",
        image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?w=800",
        metaTitle: "Immunity Boosting Fruits | Best Fruits for Strong Immunity | Sitamarhi",
        metaDescription: "Discover the best immunity-boosting fruits. Strengthen your immune system naturally with fresh fruits from STM Fruit Shop.",
        content: `<h1>Immunity Boosting Fruits</h1><p>Best fruits for immunity...</p>`,
        category: "Health",
        tags: ["immunity", "vitamin c", "health"],
        isPublished: true
    },
    {
        title: "Weight Loss Fruits - Best Fruits for Natural Weight Management",
        slug: "weight-loss-fruits-sitamarhi",
        excerpt: "Lose weight naturally with these amazing low-calorie, high-fiber fruits. Complete guide to the best fruits for weight management and healthy living.",
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800",
        metaTitle: "Weight Loss Fruits | Best Fruits for Weight Management | Sitamarhi",
        metaDescription: "Lose weight naturally with these amazing fruits. Low-calorie, high-fiber fruits delivered fresh in Sitamarhi.",
        content: `<h1>Weight Loss Fruits</h1><p>Best fruits for weight management...</p>`,
        category: "Health",
        tags: ["weight loss", "diet", "low calorie"],
        isPublished: true
    },
    {
        title: "Dry Fruits for Energy and Stamina - Natural Energy Boosters",
        slug: "dry-fruits-energy-stamina-sitamarhi",
        excerpt: "Boost your energy and stamina naturally with premium dry fruits. Learn which dry fruits provide instant energy and sustained stamina throughout the day.",
        image: "https://images.unsplash.com/photo-1508736793122-f516e3ba5569?w=800",
        metaTitle: "Dry Fruits for Energy | Natural Energy Boosters | Sitamarhi",
        metaDescription: "Boost your energy and stamina naturally with premium dry fruits. Buy fresh dry fruits online in Sitamarhi.",
        content: `<h1>Dry Fruits for Energy</h1><p>Energy-boosting dry fruits guide...</p>`,
        category: "Health",
        tags: ["energy", "stamina", "dry fruits"],
        isPublished: true
    },
    {
        title: "Fresh Fruit Juices in Sitamarhi - Healthy & Refreshing",
        slug: "fresh-fruit-juices-sitamarhi",
        excerpt: "Enjoy fresh, healthy fruit juices in Sitamarhi. 100% natural, no preservatives, no added sugar. Order fresh juices from STM Fruit Shop for home delivery.",
        image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=800",
        metaTitle: "Fresh Fruit Juices Sitamarhi | Healthy Juices | STM Fruit Shop",
        metaDescription: "Enjoy fresh, healthy fruit juices in Sitamarhi. 100% natural, no preservatives. Order from STM Fruit Shop.",
        content: `<h1>Fresh Fruit Juices</h1><p>Healthy juice options...</p>`,
        category: "Products",
        tags: ["juices", "healthy drinks", "fresh juice"],
        isPublished: true
    },
    {
        title: "Gift Hampers and Fruit Baskets in Sitamarhi - Perfect for Every Occasion",
        slug: "fruit-gift-hampers-sitamarhi",
        excerpt: "Send fresh fruit gift hampers and baskets in Sitamarhi. Perfect for festivals, birthdays, and special occasions. Same-day delivery available.",
        image: "https://images.unsplash.com/photo-1549488344-cbb6c34cf08b?w=800",
        metaTitle: "Fruit Gift Hampers Sitamarhi | Gift Baskets | STM Fruit Shop",
        metaDescription: "Send fresh fruit gift hampers and baskets in Sitamarhi. Perfect for festivals, birthdays, and special occasions.",
        content: `<h1>Fruit Gift Hampers</h1><p>Gift hamper options...</p>`,
        category: "Products",
        tags: ["gift hampers", "fruit baskets", "gifts"],
        isPublished: true
    }
];

// Combine all blogs
const allBlogs = [...seoBlogs, ...remainingBlogs];

// Seed blogs function
async function seedBlogs() {
    try {
        console.log('\n🚀 Starting SEO Blog Seeding...\n');

        // Clear existing blogs (optional - comment out if you want to keep existing blogs)
        // await Blog.deleteMany({});
        // console.log('✅ Cleared existing blogs\n');

        // Insert all blogs
        let successCount = 0;
        let errorCount = 0;

        for (const blogData of allBlogs) {
            try {
                // Check if blog already exists
                const existingBlog = await Blog.findOne({ slug: blogData.slug });
                
                if (existingBlog) {
                    console.log(`⚠️  Blog already exists: ${blogData.title}`);
                    continue;
                }

                // Create new blog
                const blog = new Blog(blogData);
                await blog.save();
                
                successCount++;
                console.log(`✅ Created: ${blogData.title}`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Error creating ${blogData.title}:`, error.message);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 SEEDING COMPLETE');
        console.log('='.repeat(60));
        console.log(`✅ Successfully created: ${successCount} blogs`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📝 Total blogs in database: ${await Blog.countDocuments()}`);
        console.log('='.repeat(60) + '\n');

        console.log('🎉 All SEO blogs have been added to your database!');
        console.log('📍 Visit your website to see the blogs live.\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding Error:', error);
        process.exit(1);
    }
}

// Run the seeding
connectDB().then(() => {
    seedBlogs();
});
