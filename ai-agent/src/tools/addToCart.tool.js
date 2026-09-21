/**
 * addToCart.tool.js
 * ──────────────────
 * WRITE tool — adds a product to the authenticated user's cart.
 *
 * SECURITY GUARANTEE:
 *   ctx.userId comes from the JWT-authenticated request (set by authToken middleware).
 *   cartService.addItem() uses ONLY ctx.userId — no LLM-generated userId argument
 *   can ever target a different user's cart. This is enforced at the service level.
 *
 * CONFIRMATION RULE:
 *   The agent reports success ONLY if { success: true } comes back from the service.
 *   The system prompt reinforces this, but the code is the actual guarantee.
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const schemas                   = require("./schemas");
const cartService               = require("../../../services/cartService");
const aiLogger                  = require("../utils/aiLogger");

function createAddToCartTool(ctx) {
  return new DynamicStructuredTool({
    name:        "addToCart",
    description: "Add a product to the current user's cart. Requires a valid productId. Ask the user to confirm the product if ambiguous.",
    schema:      schemas.addToCart,

    func: async ({ productId, quantity = 1 }) => {
      const start = Date.now();
      try {
        const result = await cartService.addItem(ctx.userId, productId, quantity);
        aiLogger.toolCall(ctx.requestId, "addToCart", { productId, quantity }, Date.now() - start, result.success);

        if (!result.success) {
          return JSON.stringify({ success: false, message: result.error });
        }

        return JSON.stringify({
          success: true,
          message: result.message,
          cartItem: {
            productId: result.product?.id || productId,
            quantity: result.cartItem?.quantity,
          },
          product: result.product,
        });
      } catch (err) {
        aiLogger.error("tool.addToCart.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({ success: false, message: "Could not add item to cart. Please try again." });
      }
    },
  });
}

module.exports = { createAddToCartTool };
