/**
 * Run once: node scripts/createIndexes.js
 * Creates MongoDB text index on products for fast search
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

async function createIndexes() {
  await connectDB();
  const db = mongoose.connection.db;

  console.log("⚡ Creating text index on products...");

  try {
    await db.collection("products").createIndex(
      {
        productName: "text",
        category: "text",
        brandName: "text",
        description: "text",
      },
      {
        weights: {
          productName: 10,
          category: 5,
          brandName: 3,
          description: 1,
        },
        name: "product_text_search",
        background: true,
      }
    );
    console.log("✅ Text index created on products");
  } catch (err) {
    if (err.code === 85 || err.code === 86) {
      console.log("ℹ️  Text index already exists");
    } else {
      throw err;
    }
  }

  try {
    await db.collection("products").createIndex(
      { isTrending: -1, viewCount: -1 },
      { name: "trending_viewcount", background: true }
    );
    console.log("✅ Trending index created");
  } catch {}

  try {
    await db.collection("products").createIndex(
      { category: 1, isTrending: -1 },
      { name: "category_trending", background: true }
    );
    console.log("✅ Category+trending compound index created");
  } catch {}

  console.log("🎉 All indexes created successfully");
  await mongoose.disconnect();
  process.exit(0);
}

createIndexes().catch((err) => {
  console.error("❌ Index creation failed:", err);
  process.exit(1);
});
