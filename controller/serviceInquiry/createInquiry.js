const serviceInquiryModel = require("../../models/serviceInquiryModel");
const nodemailer = require("nodemailer");

// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const createInquiry = async (req, res) => {
  try {
    const { fullName, email, phone, service, budgetRange, projectDetails } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone || !service || !projectDetails) {
      return res.status(400).json({
        message: "All required fields must be filled",
        success: false,
        error: true,
      });
    }

    // Create inquiry
    const inquiry = new serviceInquiryModel({
      fullName,
      email,
      phone,
      service,
      budgetRange,
      projectDetails,
    });

    const savedInquiry = await inquiry.save();

    // Send email notification to admin
    const adminEmailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .info-row { margin: 15px 0; padding: 10px; background: #f9f9f9; border-radius: 5px; }
          .label { font-weight: bold; color: #667eea; }
          .value { color: #333; margin-top: 5px; }
          .footer { background: #f7fafc; padding: 20px; text-align: center; color: #718096; font-size: 14px; }
          .badge { background: #48bb78; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Service Inquiry!</h1>
            <p style="margin: 10px 0 0; font-size: 16px;">You have received a new inquiry</p>
          </div>
          
          <div class="content">
            <div class="info-row">
              <div class="label">Service Requested:</div>
              <div class="value"><span class="badge">${service}</span></div>
            </div>

            <div class="info-row">
              <div class="label">Full Name:</div>
              <div class="value">${fullName}</div>
            </div>

            <div class="info-row">
              <div class="label">Email:</div>
              <div class="value">${email}</div>
            </div>

            <div class="info-row">
              <div class="label">Phone:</div>
              <div class="value">${phone}</div>
            </div>

            ${budgetRange ? `
            <div class="info-row">
              <div class="label">Budget Range:</div>
              <div class="value">${budgetRange}</div>
            </div>
            ` : ''}

            <div class="info-row">
              <div class="label">Project Details:</div>
              <div class="value">${projectDetails}</div>
            </div>

            <div class="info-row">
              <div class="label">Inquiry ID:</div>
              <div class="value">${savedInquiry._id}</div>
            </div>

            <div class="info-row">
              <div class="label">Received At:</div>
              <div class="value">${new Date(savedInquiry.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>STM FRUIT SHOP</strong></p>
            <p>Service Inquiry Management System</p>
            <p>📞 +91 9508548671 | 📧 rahulkumar9508548671@gmail.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to admin
    try {
      await transporter.sendMail({
        from: `"STM FRUIT SHOP - Service Inquiry" <${process.env.SMTP_USER}>`,
        to: process.env.ADMIN_EMAIL,
        subject: `🔔 New ${service} Inquiry from ${fullName}`,
        html: adminEmailTemplate,
      });
      console.log("✅ Admin email notification sent");
    } catch (emailError) {
      console.error("❌ Error sending admin email:", emailError);
    }

    // Log WhatsApp notification (requires API integration)
    const whatsappMessage = `🔔 *New Service Inquiry!*

*Service:* ${service}
*Name:* ${fullName}
*Email:* ${email}
*Phone:* ${phone}
${budgetRange ? `*Budget:* ${budgetRange}` : ''}

*Project Details:*
${projectDetails}

*Inquiry ID:* ${savedInquiry._id}
*Time:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

_Check admin panel for more details_`;

    console.log("📱 WhatsApp notification prepared:");
    console.log(whatsappMessage);
    console.log(`Send to: +919508548671`);

    res.status(201).json({
      message: "Inquiry submitted successfully! We'll contact you soon.",
      success: true,
      error: false,
      data: savedInquiry,
    });
  } catch (error) {
    console.error("❌ Error creating inquiry:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = createInquiry;
