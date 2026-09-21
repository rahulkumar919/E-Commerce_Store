const mongoose = require("mongoose");
const addToCart = require("../../models/cartProduct");
const productModel = require("../../models/productModel");

const addTocartController = async (req, res) => {
  try {
    let cleanProductId = req.body?.productId;
    if (typeof cleanProductId === "object" && cleanProductId !== null) {
      cleanProductId = cleanProductId._id || cleanProductId.id || cleanProductId.productId || String(cleanProductId);
    }
    cleanProductId = String(cleanProductId || "").trim();

    const currentUser = req.user?._id || req.userId;

    console.log("🛒 Add to cart request:", { productId: cleanProductId, currentUser });

    if (!currentUser) {
      console.log("❌ No user found in request");
      return res.status(401).json({
        success: false,
        error: true,
        message: "User not authenticated",
      });
    }

    if (!cleanProductId) {
      console.log("❌ No product ID provided");
      return res.status(400).json({
        success: false,
        error: true,
        message: "Product ID is required",
      });
    }

    // ✅ Resolve valid ObjectId if product name was passed
    if (!mongoose.isValidObjectId(cleanProductId)) {
      const found = await productModel.findOne({
        productName: { $regex: cleanProductId, $options: "i" },
        isAvailable: true,
      });
      if (found) {
        cleanProductId = found._id.toString();
      } else {
        return res.status(404).json({
          success: false,
          error: true,
          message: "Product not found",
        });
      }
    }

    // ✅ Check if product already in cart
    const existingItem = await addToCart.findOne({ 
      productId: cleanProductId, 
      userId: currentUser 
    });

    if (existingItem) {
      console.log("📦 Product already in cart, updating quantity");
      // ✅ If already there, increase quantity
      existingItem.quantity += 1;
      await existingItem.save();

      return res.json({
        success: true,
        error: false,
        message: "Product quantity updated in your cart 🛒",
        data: existingItem,
      });
    }

    // ✅ Add new product to cart
    console.log("➕ Adding new product to cart");
    const payload = {
      productId: cleanProductId,
      userId: currentUser,
      quantity: 1,
    };

    const newCartItem = new addToCart(payload);
    const savedItem = await newCartItem.save();

    console.log("✅ Product added successfully:", savedItem);

    res.json({
      success: true,
      error: false,
      message: "Product added to your cart 🛍️",
      data: savedItem,
    });

  } catch (err) {
    console.error("❌ Add to cart error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Something went wrong while adding to cart.",
    });
  }
};

module.exports = addTocartController;
