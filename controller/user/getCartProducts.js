const addToCart = require("../../models/cartProduct");
const Product = require("../../models/productModel");

const getCartProducts = async (req, res) => {
  try {
    const currentUser = req.user?._id || req.userId;

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        error: true,
        message: "User not authenticated",
      });
    }

    // Get all cart items and populate product details
    const cartItems = await addToCart.find({ userId: currentUser }).populate("productId");

    // Filter out items where the product was deleted (productId is null)
    const validCartItems = cartItems.filter(item => item.productId != null);

    res.json({
      success: true,
      error: false,
      data: validCartItems,
      message: "Cart items fetched successfully",
    });

  } catch (err) {
    console.error("❌ Get cart error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to fetch cart items",
    });
  }
};

module.exports = getCartProducts;
