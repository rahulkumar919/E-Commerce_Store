const orderModel = require("../../models/orderModel");

const createCODOrder = async (req, res) => {
  try {
    const { products, shippingAddress, subtotal, tax, total } = req.body;

    if (!products || !shippingAddress || !subtotal || !tax || !total) {
      return res.status(400).json({
        message: "All fields are required",
        error: true,
        success: false,
      });
    }

    // Create COD order
    const newOrder = new orderModel({
      userId: req.userId,
      products,
      shippingAddress,
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      subtotal,
      tax,
      total,
      orderStatus: "CONFIRMED",
    });

    await newOrder.save();

    res.status(200).json({
      message: "Order placed successfully with Cash on Delivery",
      data: newOrder,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Create COD Order Error:", error);
    res.status(500).json({
      message: error.message || "Failed to create order",
      error: true,
      success: false,
    });
  }
};

module.exports = createCODOrder;
