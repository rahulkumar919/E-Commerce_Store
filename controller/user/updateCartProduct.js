const addToCart = require("../../models/cartProduct");

const updateCartProduct = async (req, res) => {
  try {
    const { _id, quantity } = req.body;
    const currentUser = req.user?._id || req.userId;

    if (!_id || !quantity) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Cart item ID and quantity are required",
      });
    }

    // Update the cart item
    const updatedItem = await addToCart.findOneAndUpdate(
      { _id, userId: currentUser },
      { quantity },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Cart item not found",
      });
    }

    res.json({
      success: true,
      error: false,
      data: updatedItem,
      message: "Cart updated successfully",
    });

  } catch (err) {
    console.error("❌ Update cart error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to update cart",
    });
  }
};

module.exports = updateCartProduct;
