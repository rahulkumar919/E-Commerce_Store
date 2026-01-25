const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "rahulkumar9508548671@gmail.com",
    pass: "rkyg rxkl ixzv hvno", // Gmail App Password
  },
});

const SendEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: '"Rahul 👨‍💻" <rahulkumar9508548671@gmail.com>',
      to: "rk1506303@gmail.com",
      subject: "Hello ✔",
      text: "Hello world?",
      html: "<b>Hello world?</b>",
    }); 

    console.log("Email sent successfully! Message ID:", info.messageId);
  } catch (err) {
    console.error("Email Generator Getting Error:", err.message);
  }
};

SendEmail();

// If you also want to export it (for controller use)
module.exports = { SendEmail, transporter };
