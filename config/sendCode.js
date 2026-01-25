const { transporter } = require("./email");

const SendOtp = async (email, verificationCode) => {
  try {
    const response = await transporter.sendMail({
      from: '"Rahul 👨‍💻" <rahulkumar9508548671@gmail.com>', 
      to: email,
      subject: "Verify Your Email",
      text: "Verify Your Email",
      html: `<p>Your verification code is: <b>${verificationCode}</b></p>`,
    });

    console.log("✅ Email sent successfully:", response.messageId);
    return true; // ✅ success indicator
  } catch (err) {
    console.error("❌ Email Error:", err.message);
    return false; // ✅ failure indicator
  }
};

module.exports = SendOtp;
