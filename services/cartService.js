/**
 * cartService.js — Cart data access layer for AI tools
 * ──────────────────────────────────────────────────────
 * Wraps the existing cartProduct model.
 * All methods take userId from the service caller (ai tool → ctx.userId).
 * No method accepts userId as free-form input that the LLM generated.
 *
 * addItem    — add or increment quantity
 * removeItem — delete a cart entry by product
 * updateQty  — set exact quantity
 * getItems   — return populated cart for the user
 */

"use strict";

const mongoose    = require("mongoose");
const CartModel   = require("../models/cartProduct");
const productModel = require("../models/productModel");

/**
 * getCartItems — Return all cart items for a user, with product details populated.
 *
 * @param {string} userId
 * @returns {{ success: true, items: object[], total: number } | { success: false, error: string }}
 */
async function getCartItems(userId) {
  try {
    const items = await CartModel.find({ userId: String(userId) })
      .populate("productId", "_id productName brandName selling price productImage category isAvailable stock")
      .lean();

    // Filter out items whose product was deleted
    const valid = items.filter((i) => i.productId != null);

    const total = valid.reduce(
      (sum, i) => sum + (i.productId?.selling || 0) * (i.quantity || 1),
      0
    );

    return { success: true, items: valid, total };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * addItem — Add a product to cart, or increment quantity if it already exists.
 *
 * @param {string} userId
 * @param {string} productId
 * @param {number} [quantity=1]
 */
async function addItem(userId, productId, quantity = 1) {
  try {
    let cleanId = productId;
    if (typeof cleanId === "object" && cleanId !== null) {
      cleanId = cleanId._id || cleanId.id || cleanId.productId || String(cleanId);
    }
    cleanId = String(cleanId || "").trim();

    let product = null;
    if (mongoose.isValidObjectId(cleanId)) {
      product = await productModel.findById(cleanId).lean();
    }

    // Fallback: If not found by ObjectId, or if cleanId was passed as product name/keyword
    if (!product && cleanId) {
      product = await productModel.findOne({
        productName: { $regex: cleanId, $options: "i" },
        isAvailable: true,
      }).lean();
    }

    if (!product) {
      return { success: false, error: `Product "${productId}" not found` };
    }

    const targetProductId = product._id.toString();

    if (!product.isAvailable) return { success: false, error: `${product.productName} is currently unavailable` };
    if (product.stock === 0)  return { success: false, error: `${product.productName} is out of stock` };

    const productSummary = {
      id:            targetProductId,
      _id:           targetProductId,
      productId:     targetProductId,
      name:          product.productName,
      productName:   product.productName,
      price:         product.selling,
      selling:       product.selling,
      originalPrice: product.price,
      image:         Array.isArray(product.productImage) ? product.productImage[0] : (product.productImage || ""),
      productImage:  product.productImage,
      category:      product.category,
      stock:         product.stock,
      inStock:       true,
    };

    const existing = await CartModel.findOne({ userId: String(userId), productId: targetProductId });

    if (existing) {
      existing.quantity += quantity;
      await existing.save();
      return {
        success:  true,
        message:  `Quantity for ${product.productName} updated to ${existing.quantity}`,
        cartItem: existing.toObject(),
        product:  productSummary,
      };
    }

    const newItem = await CartModel.create({
      userId:    String(userId),
      productId: targetProductId,
      quantity:  Math.max(1, quantity),
    });

    return {
      success:  true,
      message:  `${product.productName} added to cart`,
      cartItem: newItem.toObject(),
      product:  productSummary,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * removeItem — Remove a product from the user's cart entirely.
 *
 * @param {string} userId
 * @param {string} productId
 */
async function removeItem(userId, productId) {
  try {
    let cleanId = productId;
    if (typeof cleanId === "object" && cleanId !== null) {
      cleanId = cleanId._id || cleanId.id || cleanId.productId || String(cleanId);
    }
    cleanId = String(cleanId || "").trim();

    if (!mongoose.isValidObjectId(cleanId)) {
      return { success: false, error: "Invalid product ID" };
    }

    const deleted = await CartModel.findOneAndDelete({
      userId: String(userId),
      productId: cleanId,
    });

    if (!deleted) return { success: false, error: "Item not found in cart" };
    return { success: true, message: "Item removed from cart" };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * updateQuantity — Set the exact quantity for a cart item.
 *
 * @param {string} userId
 * @param {string} productId
 * @param {number} quantity   Must be ≥ 1
 */
async function updateQuantity(userId, productId, quantity) {
  try {
    let cleanId = productId;
    if (typeof cleanId === "object" && cleanId !== null) {
      cleanId = cleanId._id || cleanId.id || cleanId.productId || String(cleanId);
    }
    cleanId = String(cleanId || "").trim();

    if (!mongoose.isValidObjectId(cleanId)) {
      return { success: false, error: "Invalid product ID" };
    }
    if (!quantity || quantity < 1) {
      return { success: false, error: "Quantity must be at least 1" };
    }

    const updated = await CartModel.findOneAndUpdate(
      { userId: String(userId), productId: cleanId },
      { quantity },
      { new: true }
    );

    if (!updated) return { success: false, error: "Item not found in cart" };
    return { success: true, message: `Quantity updated to ${quantity}`, cartItem: updated.toObject() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { getCartItems, addItem, removeItem, updateQuantity };
