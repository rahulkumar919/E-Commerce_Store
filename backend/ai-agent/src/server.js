const express = require("express");
const ProductModel = require("../../models/productModel");
const CartModel = require("../../models/cartProduct");
const { runAgent } = require("./agent/agent");

const router = express.Router();

router.post("/chat", async (req, res) => {
  try {
    const { query, sessionId, userId } = req.body;
    if (!query?.trim())
      return res
        .status(400)
        .json({ success: false, message: "Query is required" });
    const result = await runAgent({
      query: query.trim(),
      sessionId,
      userId,
      ProductModel,
      CartModel,
    });
    const uniqueProducts = [
      ...new Map(
        result.products.map((product) => [String(product._id), product]),
      ).values(),
    ];
    return res.json({
      success: true,
      message: result.message,
      recommendedProducts: uniqueProducts.slice(0, 6),
      sessionId: result.sessionId,
      aiPowered: true,
    });
  } catch (error) {
    console.error("AI agent error:", error.message);
    return res
      .status(503)
      .json({
        success: false,
        message:
          "The AI assistant is temporarily unavailable. Please try again.",
      });
  }
});

module.exports = router;
