const nodemailer = require("nodemailer");
const userModel = require("../models/userModel");

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send email notification to all users
const sendNewProductEmail = async (product) => {
  try {
    // Get all users with valid emails
    const users = await userModel.find({ email: { $exists: true, $ne: "" } });

    if (users.length === 0) {
      console.log("No users found to notify");
      return;
    }

    const productUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/product-details/${product._id}`;
    const productImage = product.productImage?.[0] || "";

    // Email template
    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .product-card { background: #f9f9f9; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .product-image { width: 100%; max-width: 300px; height: auto; border-radius: 10px; margin: 0 auto; display: block; }
          .product-name { font-size: 24px; font-weight: bold; color: #333; margin: 15px 0 10px; }
          .product-price { font-size: 28px; color: #e53e3e; font-weight: bold; margin: 10px 0; }
          .old-price { text-decoration: line-through; color: #999; font-size: 18px; margin-left: 10px; }
          .discount { background: #48bb78; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; display: inline-block; margin: 10px 0; }
          .description { color: #666; line-height: 1.6; margin: 15px 0; }
          .cta-button { display: inline-block; background: #e53e3e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; margin: 20px 0; transition: background 0.3s; }
          .cta-button:hover { background: #c53030; }
          .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; }
          .whatsapp-btn { display: inline-block; background: #25D366; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 10px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Product Alert!</h1>
            <p style="margin: 10px 0 0; font-size: 16px;">Fresh arrival just for you</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px; color: #333;">Hello! 👋</p>
            <p style="color: #666;">We're excited to introduce our latest product at <strong>STM FRUIT SHOP</strong>!</p>
            
            <div class="product-card">
              ${productImage ? `<img src="${productImage}" alt="${product.productName}" class="product-image" />` : ""}
              
              <div class="product-name">${product.productName}</div>
              
              <div>
                <span class="product-price">₹${product.selling}</span>
                ${product.price > product.selling ? `<span class="old-price">₹${product.price}</span>` : ""}
              </div>
              
              ${
                product.price > product.selling
                  ? `
                <span class="discount">
                  ${Math.round(((product.price - product.selling) / product.price) * 100)}% OFF
                </span>
              `
                  : ""
              }
              
              ${
                product.description
                  ? `
                <div class="description">${product.description}</div>
              `
                  : ""
              }
              
              <div style="text-align: center; margin-top: 20px;">
                <a href="${productUrl}" class="cta-button">View Product</a>
              </div>
              
              <div style="text-align: center;">
                <a href="https://wa.me/919142517255?text=${encodeURIComponent(`Hi! I'm interested in ${product.productName} priced at ₹${product.selling}`)}" class="whatsapp-btn">
                  📱 Order on WhatsApp
                </a>
              </div>
            </div>
            
            <p style="color: #666; margin-top: 20px;">
              <strong>Category:</strong> ${product.category || "N/A"}<br>
              ${product.brandName ? `<strong>Brand:</strong> ${product.brandName}<br>` : ""}
              <strong>Stock:</strong> ${product.stock > 0 ? "In Stock ✅" : "Limited Stock ⚠️"}
            </p>
          </div>
          
          <div class="footer">
            <p><strong>STM FRUIT SHOP</strong></p>
            <p>Fresh & Natural Products | Sitamarhi, Bihar</p>
            <p>📞 +91 9142517255 | 📧 rahulkumar9508548671@gmail.com</p>
            <p style="font-size: 12px; color: #a0aec0; margin-top: 15px;">
              You're receiving this because you're a valued customer of STM FRUIT SHOP.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const emailPromises = batch.map((user) => {
        return transporter.sendMail({
          from: `"STM FRUIT SHOP 🍎" <${process.env.SMTP_USER}>`,
          to: user.email,
          subject: `🎉 New Arrival: ${product.productName} - Special Price ₹${product.selling}`,
          html: emailTemplate,
        });
      });

      await Promise.allSettled(emailPromises);

      // Wait 1 second between batches to avoid rate limiting
      if (i + batchSize < users.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(
      `✅ Email notifications sent to ${users.length} users for product: ${product.productName}`,
    );
    return { success: true, count: users.length };
  } catch (error) {
    console.error("❌ Error sending email notifications:", error);
    return { success: false, error: error.message };
  }
};

// Send WhatsApp notification (using WhatsApp Business API or third-party service)
// Note: For actual WhatsApp integration, you'll need WhatsApp Business API or services like Twilio
const sendNewProductWhatsApp = async (product) => {
  try {
    // Get all users with valid mobile numbers
    const users = await userModel.find({ mobile: { $exists: true, $ne: "" } });

    if (users.length === 0) {
      console.log("No users with mobile numbers found");
      return;
    }

    const productUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/product-details/${product._id}`;

    // WhatsApp message template
    const message = `
🎉 *New Product Alert from STM FRUIT SHOP!*

*${product.productName}*

💰 Special Price: *₹${product.selling}*
${product.price > product.selling ? `~~₹${product.price}~~ (${Math.round(((product.price - product.selling) / product.price) * 100)}% OFF)` : ""}

${product.description ? `📝 ${product.description.substring(0, 100)}...` : ""}

🏷️ Category: ${product.category || "N/A"}
${product.stock > 0 ? "✅ In Stock" : "⚠️ Limited Stock"}

👉 View Product: ${productUrl}

📞 Order Now: +91 9142517255

_Fresh & Natural Products | Sitamarhi, Bihar_
    `.trim();

    console.log(`📱 WhatsApp notification prepared for ${users.length} users`);
    console.log("Message template:", message);

    // TODO: Integrate with WhatsApp Business API or Twilio
    // For now, we'll just log the notification
    // You can integrate with services like:
    // 1. Twilio WhatsApp API
    // 2. WhatsApp Business API
    // 3. Third-party services like WATI, Interakt, etc.

    return {
      success: true,
      count: users.length,
      message: "WhatsApp notifications prepared (requires API integration)",
    };
  } catch (error) {
    console.error("❌ Error preparing WhatsApp notifications:", error);
    return { success: false, error: error.message };
  }
};

// Main notification function
const notifyNewProduct = async (product) => {
  console.log(
    `\n🔔 Sending notifications for new product: ${product.productName}`,
  );

  const results = {
    email: await sendNewProductEmail(product),
    whatsapp: await sendNewProductWhatsApp(product),
  };

  console.log("Notification Results:", results);
  return results;
};

module.exports = {
  notifyNewProduct,
  sendNewProductEmail,
  sendNewProductWhatsApp,
};
