/**
 * updateCartQuantity.tool.js — WRITE tool
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const schemas                   = require("./schemas");
const cartService               = require("../../../services/cartService");
const aiLogger                  = require("../utils/aiLogger");

function createUpdateCartQuantityTool(ctx) {
  return new DynamicStructuredTool({
    name:        "updateCartQuantity",
    description: "Update the quantity of a specific product already in the user's cart.",
    schema:      schemas.updateCartQuantity,

    func: async ({ productId, quantity }) => {
      const start = Date.now();
      try {
        const result = await cartService.updateQuantity(ctx.userId, productId, quantity);
        aiLogger.toolCall(ctx.requestId, "updateCartQuantity", { productId, quantity }, Date.now() - start, result.success);

        return JSON.stringify({
          success: result.success,
          message: result.success ? result.message : result.error,
        });
      } catch (err) {
        aiLogger.error("tool.updateCartQty.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({ success: false, message: "Could not update quantity. Please try again." });
      }
    },
  });
}

module.exports = { createUpdateCartQuantityTool };
