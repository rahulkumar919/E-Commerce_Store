const wishlistModel = require("../../models/wishlistModel");

const getWishlist = async (req, res) => {
  try {
    const userId = req.userId;

    const wishlistItems = await wishlistModel
      .find({ userId })
      .populate("productId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Wishlist fetched successfully",
      success: true,
      error: false,
      data: wishlistItems,
    });
  } catch (err) {
    console.error("Error fetching wishlist:", err);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = getWishlist;
