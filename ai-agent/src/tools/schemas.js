/**
 * schemas.js — Single source of truth for all tool input schemas
 * ───────────────────────────────────────────────────────────────
 * WHY CENTRALISED:
 * LangChain uses these schemas for two things:
 *  1. Telling the LLM what arguments a tool accepts (function calling prompt)
 *  2. Runtime validation before execution
 *
 * Keeping them in one file means a schema change only happens in one place,
 * and the tool file stays focused on execution logic, not validation boilerplate.
 *
 * We use zod (already in package.json) for schema definitions.
 */

"use strict";

const { z } = require("zod");

const schemas = {
  searchProducts: z.object({
    query:    z.string().optional().describe("Product name, keyword, or description to search for"),
    category: z.string().optional().describe("Product category, e.g. Fruits, Dry Fruits, Cakes"),
    minPrice: z.number().optional().describe("Minimum selling price in rupees"),
    maxPrice: z.number().optional().describe("Maximum selling price in rupees"),
    limit:    z.number().int().min(1).max(10).optional().default(6)
               .describe("Maximum number of results to return (default 6, max 10)"),
  }),

  getProduct: z.object({
    productId: z.string().describe("MongoDB _id of the product to fetch"),
  }),

  getCart: z.object({
    // No input needed — userId comes from ctx, not from the LLM
  }),

  addToCart: z.object({
    productId: z.string().describe("MongoDB _id of the product to add, or the exact product name (e.g. 'Red Apple') if ID is not known"),
    quantity:  z.number().int().min(1).max(20).optional().default(1)
                .describe("How many units to add (default 1)"),
  }),

  removeFromCart: z.object({
    productId: z.string().describe("MongoDB _id of the product to remove"),
  }),

  updateCartQuantity: z.object({
    productId: z.string().describe("MongoDB _id of the product to update"),
    quantity:  z.number().int().min(1).max(20).describe("New quantity (must be ≥ 1)"),
  }),

  getOrderStatus: z.object({
    orderId: z.string().optional().describe("Specific order ID to look up. If omitted, returns recent orders."),
  }),
};

module.exports = schemas;
