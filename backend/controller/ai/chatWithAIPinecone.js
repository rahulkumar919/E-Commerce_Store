/**
 * AI Chat Controller with Pinecone (Legacy - Redirects to Enhanced)
 * This endpoint now uses the enhanced RAG service
 */

const productModel = require("../../models/productModel");
const cartModel = require("../../models/cartProduct");
const {
  generateEnhancedRAGResponse,
} = require("../../services/enhancedRAGService");

async function chatWithAIPinecone(req, res) {
  try {
    const { query, sessionId } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    console.log("💬 User Query (Pinecone endpoint):", query);
    console.log("⚠️ Redirecting to enhanced RAG service");

    // Use enhanced RAG service instead
    const response = await generateEnhancedRAGResponse(query, productModel, {
      sessionId,
      userId: req.user?._id || req.userId,
      CartModel: cartModel,
    });

    res.json(response);
  } catch (error) {
    console.error("Error in AI chat with Pinecone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate response",
      error: error.message,
    });
  }
}

module.exports = chatWithAIPinecone;
