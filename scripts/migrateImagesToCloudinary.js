/**
 * migrateImagesToCloudinary.js
 * ─────────────────────────────
 * One-time script: reads every product from MongoDB, uploads each image URL
 * that is NOT already on Cloudinary to the "stm-products" folder, then
 * overwrites the productImage array with the new Cloudinary secure_urls.
 *
 * Usage (from the backend/ directory):
 *   node scripts/migrateImagesToCloudinary.js
 *
 * Safe to re-run — images already hosted on res.cloudinary.com are skipped.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const productModel = require("../models/productModel");

// ─── helpers ─────────────────────────────────────────────────────────────────

const isAlreadyCloudinary = (url) =>
  typeof url === "string" && url.includes("res.cloudinary.com");

/**
 * Upload a single image URL to Cloudinary.
 * Returns the new secure_url, or the original url on failure.
 */
const uploadToCloudinary = async (imageUrl, productName) => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "stm-products",
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      // Automatic quality + format optimisation at delivery time
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });
    return result.secure_url;
  } catch (err) {
    console.warn(`  ⚠️  Upload failed for "${imageUrl}" — keeping original. ${err.message}`);
    return imageUrl; // keep original if upload fails
  }
};

// ─── main ─────────────────────────────────────────────────────────────────────

const migrate = async () => {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  const products = await productModel.find({}).select("_id productName productImage").lean();
  console.log(`📦 Found ${products.length} products to inspect\n`);

  let migratedCount = 0;
  let skippedCount  = 0;
  let errorCount    = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const images  = product.productImage || [];

    // Check if ANY image needs migrating
    const needsMigration = images.some((url) => !isAlreadyCloudinary(url));

    if (!needsMigration) {
      console.log(`[${i + 1}/${products.length}] ⏭  Skipped (already on Cloudinary): ${product.productName}`);
      skippedCount++;
      continue;
    }

    console.log(`[${i + 1}/${products.length}] 🔄 Migrating: ${product.productName}`);

    const newImages = [];
    for (const url of images) {
      if (isAlreadyCloudinary(url)) {
        newImages.push(url); // already migrated
        continue;
      }
      if (!url || !url.startsWith("http")) {
        newImages.push(url); // skip empty / relative URLs
        continue;
      }
      const newUrl = await uploadToCloudinary(url, product.productName);
      newImages.push(newUrl);
      console.log(`    ✅ ${url.substring(0, 60)}… → ${newUrl.substring(0, 60)}…`);
    }

    try {
      await productModel.findByIdAndUpdate(product._id, { productImage: newImages });
      migratedCount++;
    } catch (err) {
      console.error(`    ❌ DB update failed for ${product._id}: ${err.message}`);
      errorCount++;
    }
  }

  console.log("\n─── Migration Complete ───────────────────────────────");
  console.log(`  ✅ Migrated : ${migratedCount} products`);
  console.log(`  ⏭  Skipped  : ${skippedCount} products (already on Cloudinary)`);
  console.log(`  ❌ Errors   : ${errorCount} products`);
  console.log("─────────────────────────────────────────────────────\n");

  await mongoose.disconnect();
  process.exit(0);
};

migrate().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
