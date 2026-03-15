const orderModel = require("../../models/orderModel");
const userModel = require("../../models/userModel");
const nodemailer = require("nodemailer");

// Create transporter for status update emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send order status update email to customer
const sendStatusUpdateEmail = async (orderDetails, newStatus) => {
  try {
    const statusMessages = {
      CONFIRMED: "Your order has been confirmed and will be processed soon.",
      SHIPPED: "Your order has been shipped! Track your package.",
      DELIVERED: "Your order has been delivered. Thank you for shopping!",
      CANCELLED: "Your order has been cancelled.",
    };

    const mailOptions = {
      from: `"Digital Shop" <${process.env.SMTP_USER}>`,
      to: orderDetails.customerEmail,
      subject: `Order Status Updated - Order #${orderDetails.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <h2 style="color: #e53e3e; margin-top: 0;">📦 Order Status Update</h2>
            <p style="color: #666; font-size: 16px;">${statusMessages[newStatus] || "Your order status has been updated."}</p>
            
            <!-- Order Details -->
            <div style="background: #f0f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #333;">Order ID:</td>
                  <td style="padding: 8px; color: #666;">${orderDetails.orderId}</td>
                </tr>
                <tr style="background: white;">
                  <td style="padding: 8px; font-weight: bold; color: #333;">Status:</td>
                  <td style="padding: 8px; color: #e53e3e; font-weight: bold;">${newStatus}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #333;">Total Amount:</td>
                  <td style="padding: 8px; color: #666;">₹${orderDetails.totalAmount}</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>Thank you for shopping with Digital Shop!</p>
              <p>© 2024 Digital Shop. All rights reserved.</p>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Status update email sent to customer:", orderDetails.customerEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending status update email:", error.message);
    return false;
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;

    // Validate input
    if (!orderId || !newStatus) {
      return res.status(400).json({
        message: "Order ID and new status are required",
        error: true,
        success: false,
      });
    }

    // Validate status
    const validStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!validStatuses.includes(newStatus)) {
      return res.status(400).json({
        message: `Invalid status. Valid statuses are: ${validStatuses.join(", ")}`,
        error: true,
        success: false,
      });
    }

    // Find and update order
    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { orderStatus: newStatus },
      { new: true }
    ).populate("userId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        error: true,
        success: false,
      });
    }

    // Send email to customer about status update
    if (order.userId && order.userId.email) {
      const orderDetails = {
        orderId: order._id.toString(),
        customerEmail: order.userId.email,
        totalAmount: order.total,
      };

      // Send email (non-blocking)
      sendStatusUpdateEmail(orderDetails, newStatus).catch((err) =>
        console.error("Email sending error:", err)
      );
    }

    res.status(200).json({
      message: `Order status updated to ${newStatus}`,
      data: order,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({
      message: error.message || "Failed to update order status",
      error: true,
      success: false,
    });
  }
};

// Get all orders (for admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate("userId", "name email")
      .populate("products.productId", "productName price productImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Orders fetched successfully",
      data: orders,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch orders",
      error: true,
      success: false,
    });
  }
};

// Get single order details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderModel
      .findById(orderId)
      .populate("userId", "name email phone")
      .populate("products.productId", "productName price productImage");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        error: true,
        success: false,
      });
    }

    res.status(200).json({
      message: "Order details fetched successfully",
      data: order,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Get Order Details Error:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch order details",
      error: true,
      success: false,
    });
  }
};

module.exports = {
  updateOrderStatus,
  getAllOrders,
  getOrderDetails,
};
