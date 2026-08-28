const Razorpay = require("razorpay");

const createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    console.log("💰 Creating order for amount:", amount);

    if (!amount) {
      return res.status(400).json({
        message: "Amount is required",
        error: true,
        success: false,
      });
    }

    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error("❌ Razorpay keys not configured");
      return res.status(500).json({
        message: "Payment gateway not configured. Please contact support.",
        error: true,
        success: false,
      });
    }

    // console.log("🔑 Razorpay Key ID:", process.env.RAZORPAY_KEY_ID);

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const options = {
      amount: amount * 100, // amount in paise (₹1 = 100 paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("📦 Creating Razorpay order with options:", options);

    const order = await razorpay.orders.create(options);

    console.log("✅ Order created successfully:", order.id);

    res.status(200).json({
      message: "Order created successfully",
      data: order,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("❌ Create Order Error:", error);
    res.status(500).json({
      message: error.message || "Failed to create order",
      error: true,
      success: false,
    });
  }
};

module.exports = createOrder;
