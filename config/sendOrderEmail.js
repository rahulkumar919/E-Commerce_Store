require("dotenv").config();
const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ Order Email SMTP ready");
  }
});

// Send order notification to admin
const sendOrderNotification = async (orderDetails) => {
  try {
    const mailOptions = {
      from: `"Digital Shop" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🎉 New Order Received - Order #${orderDetails.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <h2 style="color: #e53e3e; margin-top: 0;">🎉 New Order Notification</h2>
            <p style="color: #666; font-size: 16px;">A new order has been placed on Digital Shop!</p>
            
            <!-- Order Details Section -->
            <div style="background: #f0f4f8; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #e53e3e;">
              <h3 style="color: #333; margin-top: 0;">📦 Order Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #333;">Order ID:</td>
                  <td style="padding: 8px; color: #666;">${orderDetails.orderId}</td>
                </tr>
                <tr style="background: white;">
                  <td style="padding: 8px; font-weight: bold; color: #333;">Order Date:</td>
                  <td style="padding: 8px; color: #666;">${new Date(orderDetails.orderDate).toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #333;">Total Amount:</td>
                  <td style="padding: 8px; color: #e53e3e; font-weight: bold; font-size: 18px;">₹${orderDetails.totalAmount}</td>
                </tr>
                <tr style="background: white;">
                  <td style="padding: 8px; font-weight: bold; color: #333;">Payment Method:</td>
                  <td style="padding: 8px; color: #666;">${orderDetails.paymentMethod}</td>
                </tr>
              </table>
            </div>

            <!-- Customer Details Section -->
            <div style="background: #fff5f5; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #fc8181;">
              <h3 style="color: #333; margin-top: 0;">👤 Customer Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #333;">Name:</td>
                  <td style="padding: 8px; color: #666;">${orderDetails.customerName}</td>
                </tr>
                <tr style="background: white;">
                  <td style="padding: 8px; font-weight: bold; color: #333;">Email:</td>
                  <td style="padding: 8px; color: #666;">${orderDetails.customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px; font-weight: bold; color: #333;">Mobile:</td>
                  <td style="padding: 8px; color: #666;">${orderDetails.customerMobile}</td>
                </tr>
              </table>
            </div>

            <!-- Shipping Address Section -->
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #86efac;">
              <h3 style="color: #333; margin-top: 0;">📍 Shipping Address:</h3>
              <p style="color: #666; margin: 5px 0;">
                ${orderDetails.shippingAddress.address}<br>
                ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.pincode}
              </p>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/admin/orders" 
                 style="background: #e53e3e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
                View Order in Admin Panel
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>This is an automated email from Digital Shop. Please do not reply to this email.</p>
              <p>© 2024 Digital Shop. All rights reserved.</p>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Order notification email sent to admin:", process.env.ADMIN_EMAIL);
    return true;
  } catch (error) {
    console.error("❌ Error sending order email:", error.message);
    return false;
  }
};

// Send order confirmation to customer
const sendOrderConfirmationToCustomer = async (orderDetails) => {
  try {
    const mailOptions = {
      from: `"Digital Shop" <${process.env.SMTP_USER}>`,
      to: orderDetails.customerEmail,
      subject: `Order Confirmation - Order #${orderDetails.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <h2 style="color: #e53e3e; margin-top: 0;">✅ Order Confirmed!</h2>
            <p style="color: #666; font-size: 16px;">Thank you for your order. We've received it and will process it soon.</p>
            
            <!-- Order Details -->
            <div style="background: #f0f4f8; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Order Details:</h3>
              <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
              <p><strong>Total Amount:</strong> <span style="color: #e53e3e; font-weight: bold; font-size: 18px;">₹${orderDetails.totalAmount}</span></p>
              <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
            </div>

            <!-- Shipping Address -->
            <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Shipping To:</h3>
              <p style="color: #666; margin: 5px 0;">
                ${orderDetails.shippingAddress.address}<br>
                ${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.pincode}
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px; text-align: center; color: #999; font-size: 12px;">
              <p>We'll send you tracking information once your order ships.</p>
              <p>© 2024 Digital Shop. All rights reserved.</p>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Order confirmation email sent to customer:", orderDetails.customerEmail);
    return true;
  } catch (error) {
    console.error("❌ Error sending confirmation email:", error.message);
    return false;
  }
};

module.exports = {
  sendOrderNotification,
  sendOrderConfirmationToCustomer,
};
