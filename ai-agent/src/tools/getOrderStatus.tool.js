/**
 * getOrderStatus.tool.js — READ tool
 * Returns order(s) for the authenticated user only.
 * userId ownership enforced in orderService — never supplied by the LLM.
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const schemas                   = require("./schemas");
const orderService              = require("../../../services/orderService");
const { sanitizeToolOutput }    = require("../utils/sanitize");
const aiLogger                  = require("../utils/aiLogger");

function createGetOrderStatusTool(ctx) {
  return new DynamicStructuredTool({
    name:        "getOrderStatus",
    description: "Get the status and details of the user's orders. If no orderId is given, returns their most recent orders.",
    schema:      schemas.getOrderStatus,

    func: async ({ orderId } = {}) => {
      const start = Date.now();
      try {
        let result;

        if (orderId && orderId.trim()) {
          result = await orderService.getOrderById(ctx.userId, orderId.trim());
        } else {
          result = await orderService.getOrdersForUser(ctx.userId, 3);
        }

        aiLogger.toolCall(ctx.requestId, "getOrderStatus", { orderId }, Date.now() - start, result.success);

        if (!result.success) {
          return JSON.stringify({ success: false, message: result.error });
        }

        const data = result.order ? { order: sanitizeToolOutput(result.order) }
                                  : { orders: sanitizeToolOutput(result.orders) };
        return JSON.stringify({ success: true, ...data });
      } catch (err) {
        aiLogger.error("tool.getOrderStatus.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({ success: false, message: "Could not fetch order information." });
      }
    },
  });
}

module.exports = { createGetOrderStatusTool };
