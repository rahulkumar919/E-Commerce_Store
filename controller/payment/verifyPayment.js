const crypto = require("crypto");
const Razorpay = require("razorpay");
const orderModel = require("../../models/orderModel");

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderData,
    } = req.body;

    console.log("🔐 Verifying payment...");
    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error("❌ Missing payment details");
      return res.status(400).json({
        message: "Missing payment details. Payment verification failed.",
        error: true,
        success: false,
      });
    }

    if (!orderData || !orderData.products || orderData.products.length === 0) {
      console.error("❌ Missing order data");
      return res.status(400).json({
        message: "Invalid order data",
        error: true,
        success: false,
      });
    }

    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ Razorpay secret key not configured");
      return res.status(500).json({
        message: "Payment gateway configuration error",
        error: true,
        success: false,
      });
    }

    // Step 1: Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    console.log("Expected signature:", expectedSign);
    console.log("Received signature:", razorpay_signature);

    if (razorpay_signature !== expectedSign) {
      console.error("❌ Payment signature mismatch - FRAUD ATTEMPT!");
      return res.status(400).json({
        message: "Payment verification failed. Invalid signature.",
        error: true,
        success: false,
      });
    }

    console.log("✅ Payment signature verified");

    // Step 2: Verify payment status with Razorpay API
    try {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });

      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log("💳 Payment details from Razorpay:", {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        method: payment.method,
      });

      // Check if payment is captured/authorized
      if (payment.status !== "captured" && payment.status !== "authorized") {
        console.error("❌ Payment not successful. Status:", payment.status);
        return res.status(400).json({
          message: `Payment not successful. Status: ${payment.status}`,
          error: true,
          success: false,
        });
      }

      // Verify amount matches
      const expectedAmount = orderData.total * 100; // Convert to paise
      if (payment.amount !== expectedAmount) {
        console.error("❌ Amount mismatch! Expected:", expectedAmount, "Got:", payment.amount);
        return res.status(400).json({
          message: "Payment amount mismatch. Please contact support.",
          error: true,
          success: false,
        });
      }

      console.log("✅ Payment status verified with Razorpay API");
    } catch (razorpayError) {
      console.error("❌ Error fetching payment from Razorpay:", razorpayError);
      return res.status(500).json({
        message: "Failed to verify payment with Razorpay. Please contact support.",
        error: true,
        success: false,
      });
    }

    // Step 3: Check if order already exists (prevent duplicate orders)
    const existingOrder = await orderModel.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingOrder) {
      console.log("⚠️ Order already exists for this payment:", existingOrder._id);
      return res.status(200).json({
        message: "Order already placed for this payment",
        data: existingOrder,
        success: true,
        error: false,
      });
    }

    // Step 4: Save order to database
    const newOrder = new orderModel({
      userId: req.userId,
      products: orderData.products,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: "ONLINE",
      paymentStatus: "PAID",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      subtotal: orderData.subtotal,
      tax: orderData.tax,
      total: orderData.total,
      orderStatus: "CONFIRMED",
    });

    await newOrder.save();
    console.log("✅ Order saved to database:", newOrder._id);

    res.status(200).json({
      message: "Payment verified and order placed successfully",
      data: newOrder,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("❌ Verify Payment Error:", error);
    res.status(500).json({
      message: error.message || "Failed to verify payment",
      error: true,
      success: false,
    });
  }
};

module.exports = verifyPayment;
