/**
 * removeFromCart.tool.js — WRITE tool
 * Same userId security model as addToCart.
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const schemas                   = require("./schemas");
const cartService               = require("../../../services/cartService");
const aiLogger                  = require("../utils/aiLogger");

function createRemoveFromCartTool(ctx) {
  return new DynamicStructuredTool({
    name:        "removeFromCart",
    description: "Remove a product from the current user's cart by productId.",
    schema:      schemas.removeFromCart,

    func: async ({ productId }) => {
      const start = Date.now();
      try {
        const result = await cartService.removeItem(ctx.userId, productId);
        aiLogger.toolCall(ctx.requestId, "removeFromCart", { productId }, Date.now() - start, result.success);

        return JSON.stringify({
          success: result.success,
          message: result.success ? result.message : result.error,
        });
      } catch (err) {
        aiLogger.error("tool.removeFromCart.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({ success: false, message: "Could not remove item. Please try again." });
      }
    },
  });
}

module.exports = { createRemoveFromCartTool };
