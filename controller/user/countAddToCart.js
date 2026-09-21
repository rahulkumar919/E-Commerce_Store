const addToCartModel = require("../../models/cartProduct");
const mongoose = require("mongoose");

const countAddToCartProduct = async (req, res) => {
  try {
    const userId = req.userId;

    // Use the same logic as getCartProducts:
    // populate productId and only count items where the product still exists.
    // This prevents orphaned cart docs (whose products were deleted) from
    // inflating the badge count.
    const result = await addToCartModel.aggregate([
      // 1. Match this user's cart items
      { $match: { userId: String(userId) } },

      // 2. Join with the products collection
      {
        $lookup: {
          from: "products",        // mongoose model "product" → collection "products"
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },

      // 3. Only keep items where the product document actually exists
      { $match: { "product.0": { $exists: true } } },

      // 4. Sum quantities of the surviving items
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);

    const count = result[0]?.total || 0;

    res.json({
      data: { count },
      message: "ok",
      error: false,
      success: true,
    });
  } catch (error) {
    console.error("countAddToCart error:", error.message);
    res.json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

module.exports = countAddToCartProduct;
