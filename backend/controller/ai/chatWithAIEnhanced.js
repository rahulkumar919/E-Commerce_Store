/**
 * chatWithAIEnhanced — STM Fruit Shop
 * Delegates to the Enhanced RAG Service (Pinecone + MongoDB + Gemini 2.0 Flash)
 */

const productModel = require("../../models/productModel");
const cartModel = require("../../models/cartProduct");
const {
  generateEnhancedRAGResponse,
} = require("../../services/enhancedRAGService");

async function chatWithAIEnhanced(req, res) {
  try {
    const { query, sessionId } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    console.log(
      `\n🤖 [AI Chat] Query: "${query.trim()}" | Session: ${sessionId || "anon"}`,
    );

    const response = await generateEnhancedRAGResponse(query, productModel, {
      sessionId,
      userId: req.user?._id || req.userId,
      CartModel: cartModel,
    });

    return res.json(response);
  } catch (err) {
    console.error("❌ chatWithAIEnhanced error:", err.message);

    return res.json({
      success: true,
      message: `नमस्ते! 🙏 STM Fruit Shop में आपका स्वागत है!\n\nअभी technical issue आ गया है, लेकिन हम मदद करने के लिए तैयार हैं!\n\n📱 WhatsApp: +91 9142517255\n🛍️ Fresh fruits, dry fruits, cakes & juices available हैं।`,
      intent: "fallback",
      recommendedProducts: [],
    });
  }
}

module.exports = chatWithAIEnhanced;
