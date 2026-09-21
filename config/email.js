const nodemailer = require("nodemailer");

// Transporter uses environment variables — never hardcoded credentials
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = { transporter };
