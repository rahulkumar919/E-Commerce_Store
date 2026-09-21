/**
 * getProduct.tool.js
 * ───────────────────
 * Fetch the real details for a specific product by ID.
 * Called after searchProducts when the user asks for more detail on a specific item.
 *
 * CRITICAL: Price, stock, and availability are read from MongoDB — NEVER from LLM output.
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const schemas                   = require("./schemas");
const productService            = require("../../../services/productService");
const { sanitizeToolOutput }    = require("../utils/sanitize");
const aiLogger                  = require("../utils/aiLogger");

function createGetProductTool(ctx) {
  return new DynamicStructuredTool({
    name:        "getProduct",
    description: "Get full details for a specific product by its ID. Use after searchProducts when the user wants more information about a particular item.",
    schema:      schemas.getProduct,

    func: async ({ productId }) => {
      const start = Date.now();
      try {
        const result = await productService.getProductById(productId);
        aiLogger.toolCall(ctx.requestId, "getProduct", { productId }, Date.now() - start, result.success);

        if (!result.success) {
          return JSON.stringify({ success: false, message: result.error });
        }

        return JSON.stringify({ success: true, product: sanitizeToolOutput(result.product) });
      } catch (err) {
        aiLogger.error("tool.getProduct.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({ success: false, message: "Could not fetch product details." });
      }
    },
  });
}

module.exports = { createGetProductTool };
