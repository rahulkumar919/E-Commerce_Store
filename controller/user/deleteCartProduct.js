const addToCart = require("../../models/cartProduct");

const deleteCartProduct = async (req, res) => {
  try {
    const { _id } = req.body;
    const currentUser = req.user?._id || req.userId;

    if (!_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Cart item ID is required",
      });
    }

    // Delete the cart item
    const deletedItem = await addToCart.findOneAndDelete({
      _id,
      userId: currentUser,
    });

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Cart item not found",
      });
    }

    res.json({
      success: true,
      error: false,
      message: "Product removed from cart",
    });

  } catch (err) {
    console.error("❌ Delete cart error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to remove product from cart",
    });
  }
};

module.exports = deleteCartProduct;
