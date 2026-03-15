const orderModel = require("../../models/orderModel");
const userModel = require("../../models/userModel");
const { sendOrderNotification, sendOrderConfirmationToCustomer } = require("../../config/sendOrderEmail");

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

    // Get user details for email
    const user = await userModel.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
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

    // Send emails
    const orderDetails = {
      orderId: newOrder._id.toString(),
      orderDate: newOrder.createdAt,
      totalAmount: total,
      paymentMethod: "Cash on Delivery",
      customerName: user.name || "Customer",
      customerEmail: user.email,
      customerMobile: shippingAddress.phone,
      shippingAddress: shippingAddress,
    };

    // Send to admin and customer (non-blocking)
    Promise.all([
      sendOrderNotification(orderDetails),
      sendOrderConfirmationToCustomer(orderDetails),
    ]).catch((err) => console.error("Email sending error:", err));

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
