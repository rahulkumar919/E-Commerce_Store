/**
 * Professional RAG Chat Controller
 * Handles user queries with intelligent context retrieval
 */

const {
  generateEnhancedRAGResponse,
} = require("../../services/enhancedRAGService");
const Product = require("../../models/productModel");
const Cart = require("../../models/cartProduct");

async function chatWithRAG(req, res) {
  try {
    const { query, sessionId } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    console.log("\n" + "=".repeat(60));
    console.log("🤖 NEW RAG CHAT REQUEST");
    console.log("=".repeat(60));
    console.log("📝 Query:", query);
    console.log("⏰ Time:", new Date().toLocaleString());
    console.log("=".repeat(60) + "\n");

    // Generate response using professional RAG system
    const response = await generateEnhancedRAGResponse(query, Product, {
      sessionId,
      userId: req.user?._id || req.userId,
      CartModel: Cart,
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ RAG RESPONSE GENERATED");
    console.log("=".repeat(60));
    console.log("📊 Intent:", response.intent);
    console.log("🎯 Context Used:", response.contextUsed ? "Yes" : "No");
    console.log(
      "🛍️ Products Recommended:",
      response.recommendedProducts?.length || 0,
    );
    console.log("=".repeat(60) + "\n");

    res.json(response);
  } catch (error) {
    console.error("\n❌ RAG Chat Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process your query. Please try again.",
      error: error.message,
    });
  }
}

module.exports = chatWithRAG;
