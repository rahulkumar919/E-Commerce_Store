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

    // Get all cart items for the user
    const cartItems = await addToCart.find({ userId: currentUser });

    // Manually populate product details
    const cartWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findById(item.productId);
        return {
          _id: item._id,
          productId: product,
          quantity: item.quantity,
          userId: item.userId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      error: false,
      data: cartWithProducts,
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
