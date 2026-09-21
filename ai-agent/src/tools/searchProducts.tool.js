/**
 * searchProducts.tool.js
 * ───────────────────────
 * Searches the product catalogue based on query, category, and price range.
 *
 * ARCHITECTURE:
 *   agent.js → this tool → productService.searchProducts() → productModel → MongoDB
 *   Tool never touches Mongoose directly.
 *
 * SECURITY:
 *   No userId needed — product search is read-only, not user-scoped.
 *   Prices and stock are ALWAYS read from the database — the LLM never supplies them.
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const schemas                   = require("./schemas");
const productService            = require("../../../services/productService");
const { sanitizeToolOutput }    = require("../utils/sanitize");
const aiLogger                  = require("../utils/aiLogger");

/**
 * createSearchProductsTool — Factory that accepts ctx for per-request logging.
 * @param {{ requestId: string }} ctx
 */
function createSearchProductsTool(ctx) {
  return new DynamicStructuredTool({
    name:        "searchProducts",
    description: "Search for products by name, category, or price range. Use this for any question about what products the store sells, finding items, or checking availability.",
    schema:      schemas.searchProducts,

    func: async (input) => {
      const start = Date.now();
      try {
        const result = await productService.searchProducts(input);
        const durationMs = Date.now() - start;
        aiLogger.toolCall(ctx.requestId, "searchProducts", input, durationMs, result.success);

        if (!result.success) {
          return JSON.stringify({ success: false, message: result.error, products: [] });
        }

        if (result.products.length === 0) {
          return JSON.stringify({
            success: true,
            message: "No products found matching your search criteria.",
            products: [],
          });
        }

        const safe = sanitizeToolOutput(result.products);
        return JSON.stringify({ success: true, count: safe.length, products: safe });
      } catch (err) {
        aiLogger.error("tool.searchProducts.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({ success: false, message: "Product search failed. Please try again." });
      }
    },
  });
}

module.exports = { createSearchProductsTool };
