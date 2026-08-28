/**
 * Test Script for Email Notification System
 * 
 * This script tests the email notification functionality
 * Run with: node test-notification.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { sendNewProductEmail } = require("./services/notificationService");

// Sample product data for testing
const testProduct = {
  _id: "test123",
  productName: "Fresh Strawberries - Premium Quality",
  selling: 299,
  price: 399,
  category: "Fruits",
  brandName: "STM Fresh",
  description: "Sweet and juicy strawberries, freshly picked from local farms. Perfect for desserts, smoothies, or eating fresh!",
  productImage: ["https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500"],
  stock: 50,
  productDetails: [
    "100% Fresh and Natural",
    "Rich in Vitamin C",
    "No Artificial Colors",
    "Farm Fresh Quality"
  ],
  rating: 4.5
};

async function testEmailNotification() {
  try {
    console.log("\n🧪 Testing Email Notification System...\n");
    
    // Connect to database
    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Send test email
    console.log("📧 Sending test email notification...");
    const result = await sendNewProductEmail(testProduct);

    if (result.success) {
      console.log(`\n✅ SUCCESS! Email sent to ${result.count} users`);
      console.log("\n📬 Check user email inboxes (including spam folder)");
    } else {
      console.log("\n❌ FAILED:", result.error);
    }

    // Disconnect
    await mongoose.disconnect();
    console.log("\n👋 Disconnected from MongoDB");
    
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    process.exit(1);
  }
}

// Run test
testEmailNotification();
