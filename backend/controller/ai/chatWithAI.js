/**
 * AI Chat Controller
 * Handles user queries and returns AI-generated responses with product recommendations
 */

const productModel = require("../../models/productModel");
const cartModel = require("../../models/cartProduct");
const {
  generateEnhancedRAGResponse,
} = require("../../services/enhancedRAGService");

async function chatWithAI(req, res) {
  try {
    const { query, sessionId } = req.body;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    console.log("User Query:", query);

    // Generate RAG response
    const response = await generateEnhancedRAGResponse(query, productModel, {
      sessionId,
      userId: req.user?._id || req.userId,
      CartModel: cartModel,
    });

    res.json(response);
  } catch (error) {
    console.error("Error in AI chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate response",
      error: error.message,
    });
  }
}

module.exports = chatWithAI;
