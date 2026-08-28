const nodemailer = require("nodemailer");

const sendEmail = async (to, otp) => {
  console.log("EMAIL USER:", process.env.EMAIL_USER);
  console.log("EMAIL PASS:", process.env.EMAIL_PASS);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

   transporter.sendMail({
    
    from: `"Auth App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your OTP Verification Code",
    html: `
      <h2>Email Verification</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>Valid for 5 minutes</p>
    `,
  });
};

module.exports = sendEmail;
