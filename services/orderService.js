/**
 * orderService.js — Order data access layer for AI tools
 * ──────────────────────────────────────────────────────
 * Wraps the existing orderModel.
 * getOrdersForUser returns only orders belonging to the authenticated userId —
 * no cross-user data is ever possible regardless of what the LLM requests.
 */

"use strict";

const mongoose    = require("mongoose");
const orderModel  = require("../models/orderModel");

/**
 * getOrdersForUser — Fetch recent orders for a specific user.
 *
 * @param {string} userId    From ctx.userId (JWT-authenticated)
 * @param {number} [limit=5] Max orders to return
 */
async function getOrdersForUser(userId, limit = 5) {
  try {
    const orders = await orderModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 10))
      .populate("products.productId", "productName brandName productImage selling")
      .lean();

    return { success: true, orders };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * getOrderById — Fetch a specific order. Enforces userId ownership.
 *
 * @param {string} userId
 * @param {string} orderId
 */
async function getOrderById(userId, orderId) {
  try {
    if (!mongoose.isValidObjectId(orderId)) {
      return { success: false, error: "Invalid order ID" };
    }

    // The userId filter is the ownership guarantee — an attacker cannot
    // retrieve another user's order even if they supply a valid orderId.
    const order = await orderModel
      .findOne({ _id: orderId, userId })
      .populate("products.productId", "productName brandName productImage selling")
      .lean();

    if (!order) return { success: false, error: "Order not found" };
    return { success: true, order };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { getOrdersForUser, getOrderById };
