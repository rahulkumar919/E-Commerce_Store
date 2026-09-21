/**
 * productService.js — Product data access layer
 * ───────────────────────────────────────────────
 * WHY THIS EXISTS:
 * AI tools must never touch Mongoose directly.
 * Tool → Service → Model → MongoDB
 *
 * This thin service wraps the existing productModel with:
 *  - Input validation before hitting the DB
 *  - Consistent return shapes { success, data } or { success: false, error }
 *  - Case-insensitive category matching
 *  - Price range filtering
 *
 * EXISTING CODE: productModel was already used by controllers directly.
 * This service does NOT change any controller — it's a new layer for the AI tools.
 */

"use strict";

const mongoose    = require("mongoose");
const productModel = require("../models/productModel");

/**
 * searchProducts — Full-text + filter search
 *
 * @param {{ query?: string, category?: string, minPrice?: number, maxPrice?: number, limit?: number }}
 * @returns {{ success: true, products: object[] } | { success: false, error: string }}
 */
async function searchProducts({ query, category, minPrice, maxPrice, limit = 10 } = {}) {
  try {
    const filter = { isAvailable: true };

    if (query && query.trim()) {
      filter.$or = [
        { productName: { $regex: query.trim(), $options: "i" } },
        { description:  { $regex: query.trim(), $options: "i" } },
        { brandName:    { $regex: query.trim(), $options: "i" } },
      ];
    }

    if (category && category.trim()) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.selling = {};
      if (minPrice !== undefined) filter.selling.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.selling.$lte = Number(maxPrice);
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 20);

    const products = await productModel
      .find(filter)
      .select("_id productName brandName category selling price productImage isAvailable stock rating badge description")
      .sort({ isTrending: -1, createdAt: -1 })
      .limit(safeLimit)
      .lean();

    const normalized = products.map((p) => {
      const idStr = p._id ? p._id.toString() : "";
      return {
        ...p,
        _id: idStr,
        id: idStr,
        productId: idStr,
      };
    });

    return { success: true, products: normalized };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * getProductById — Fetch a single product by its MongoDB _id
 *
 * @param {string} productId
 * @returns {{ success: true, product: object } | { success: false, error: string }}
 */
async function getProductById(productId) {
  try {
    if (!productId || !mongoose.isValidObjectId(productId)) {
      return { success: false, error: "Invalid product ID" };
    }

    const product = await productModel
      .findById(productId)
      .select("_id productName brandName category selling price productImage isAvailable stock rating badge description productDetails")
      .lean();

    if (!product) return { success: false, error: "Product not found" };

    const idStr = product._id ? product._id.toString() : "";
    return {
      success: true,
      product: {
        ...product,
        _id: idStr,
        id: idStr,
        productId: idStr,
      },
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { searchProducts, getProductById };
