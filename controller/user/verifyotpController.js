require("dotenv").config();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const userModel = require("../../models/userModel");

// === Shared store between send & verify ===
const otpStore = new Map(); // ✅ email -> { otp, name, password, profilePic }

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Generate OTP
function generateOtp() {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}

// ================================================
// 🔹 Send OTP Controller
// ================================================
async function sendOtpController(req, res) {
  try {
    const { email, name, password, profilePic } = req.body;

    if (!email || !password || !name)
      return res.status(400).json({ success: false, message: "Missing fields" });

    const user = await userModel.findOne({ email });
    if (user)
      return res.status(400).json({ success: false, message: "User already exists" });

    const otp = generateOtp();

    // ✅ Store OTP and temporary user info
    otpStore.set(email, { otp, name, password, profilePic });
    console.log(`✅ OTP generated for ${email}: ${otp}`);

    await transporter.sendMail({
      from: `"RK Shop" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your RK Shop OTP Verification Code",
      text: `Your verification code is ${otp}. It will expire in 5 minutes.`,
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Send OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error while sending OTP" });
  }
}

// ================================================
// 🔹 Verify OTP Controller
// ================================================
async function verifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const record = otpStore.get(email);
    if (!record)
      return res.status(400).json({ success: false, message: "OTP expired or not found" });

    if (record.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    // ✅ OTP verified — create user
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(record.password, salt);

    const newUser = new userModel({
      email,
      name: record.name,
      password: hashPassword,
      profilePic: record.profilePic,
      role: "GENERAL",
      isVerified: true,
    });

    await newUser.save();

    // ✅ Remove from temp store
    otpStore.delete(email);

    res.json({ success: true, message: "Account verified successfully!" });
  } catch (err) {
    console.error("Verify OTP Error:", err);
    res.status(500).json({ success: false, message: "Server error while verifying OTP" });
  }
}

module.exports = { sendOtpController, verifyOtpController };
