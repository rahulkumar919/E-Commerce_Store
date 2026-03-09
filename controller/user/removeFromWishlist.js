const wishlistModel = require("../../models/wishlistModel");

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.userId;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required",
        success: false,
        error: true,
      });
    }

    const result = await wishlistModel.deleteOne({ userId, productId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Product not found in wishlist",
        success: false,
        error: true,
      });
    }

    res.status(200).json({
      message: "Product removed from wishlist",
      success: true,
      error: false,
    });
  } catch (err) {
    console.error("Error removing from wishlist:", err);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = removeFromWishlist;
