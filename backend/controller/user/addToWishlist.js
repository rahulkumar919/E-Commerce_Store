const wishlistModel = require("../../models/wishlistModel");

const addToWishlist = async (req, res) => {
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

    // Check if already in wishlist
    const existingItem = await wishlistModel.findOne({ userId, productId });

    if (existingItem) {
      return res.status(400).json({
        message: "Product already in wishlist",
        success: false,
        error: true,
      });
    }

    // Add to wishlist
    const wishlistItem = new wishlistModel({
      userId,
      productId,
    });

    await wishlistItem.save();

    res.status(201).json({
      message: "Product added to wishlist",
      success: true,
      error: false,
      data: wishlistItem,
    });
  } catch (err) {
    console.error("Error adding to wishlist:", err);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = addToWishlist;
