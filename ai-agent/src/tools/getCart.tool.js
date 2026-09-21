/**
 * getCart.tool.js
 * ────────────────
 * Returns the current user's cart contents.
 * userId is ALWAYS taken from ctx (JWT-authenticated) — never from tool arguments.
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const schemas                   = require("./schemas");
const cartService               = require("../../../services/cartService");
const { sanitizeToolOutput }    = require("../utils/sanitize");
const aiLogger                  = require("../utils/aiLogger");

function createGetCartTool(ctx) {
  return new DynamicStructuredTool({
    name:        "getCart",
    description: "Get the current user's shopping cart contents, including product names, quantities, and prices.",
    schema:      schemas.getCart,

    func: async () => {
      const start = Date.now();
      try {
        // ctx.userId is the ONLY source of user identity — never user-supplied
        const result = await cartService.getCartItems(ctx.userId);
        aiLogger.toolCall(ctx.requestId, "getCart", {}, Date.now() - start, result.success);

        if (!result.success) {
          return JSON.stringify({ success: false, message: result.error });
        }

        if (!result.items.length) {
          return JSON.stringify({ success: true, message: "Your cart is empty.", items: [], total: 0 });
        }

        return JSON.stringify({
          success: true,
          itemCount: result.items.length,
          total:     result.total,
          items:     sanitizeToolOutput(result.items),
        });
      } catch (err) {
        aiLogger.error("tool.getCart.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({ success: false, message: "Could not fetch cart. Please try again." });
      }
    },
  });
}

module.exports = { createGetCartTool };
