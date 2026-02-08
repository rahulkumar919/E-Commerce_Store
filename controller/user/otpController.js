// controller/user/otpController.js
require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const userModel = require("../../models/userModel");

// ---------- CONFIG ----------
const OTP_TTL = parseInt(process.env.OTP_TTL_MINUTES || "5", 10) * 60 * 1000; // 5 mins
const RESEND_LIMIT = parseInt(process.env.OTP_RESEND_LIMIT || "3", 10);
const otpStore = new Map();
const pendingUsers = new Map();

// ---------- MAIL TRANSPORTER ----------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Verify SMTP connection at startup
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP ready:", success);
  }
});

// ---------- GENERATE OTP ----------
function generateOtp() {
  return (100000 + Math.floor(Math.random() * 900000)).toString();
}

// ---------- SEND OTP ----------
async function sendOtpController(req, res) {
  try {
    console.log("📩 Received OTP request body:", req.body);

    const { email, name, password, profilePic } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ success: false, message: "Name, email, and password are required" });
    }

    // check if user already exists
    const existing = await userModel.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists. Please login." });
    }

    // generate OTP
    const otp = generateOtp();
    otpStore.set(email, { otp, createdAt: Date.now(), resendCount: 0 });

    // hash password early to avoid storing plaintext
    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(password, salt);
    pendingUsers.set(email, { name, passwordHash: hashPassword, profilePic, role: "GENERAL" });

    // cleanup after TTL
    setTimeout(() => {
      otpStore.delete(email);
      pendingUsers.delete(email);
    }, OTP_TTL);

    // send email safely
    try {
      await transporter.sendMail({
        from: `"RK Shop" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your RK Shop OTP",
        text: `Hello ${name},\n\nYour OTP is: ${otp}\nIt will expire in ${Math.round(
          OTP_TTL / 60000
        )} minutes.\n\nThank you,\nRK Shop Team`,
      });
    } catch (mailErr) {
      console.error("❌ Email send failed:", mailErr);
      return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP. Check SMTP credentials." });
    }

    console.log(" OTP sent successfully to:", email, "OTP:", otp);
    return res.json({ success: true, message: "OTP sent to your email." });
  } catch (err) {
    console.error("🔥 sendOtpController error:", err.stack || err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error while sending OTP" });
  }
}

// ---------- VERIFY OTP ----------
async function verifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP are required" });

    const record = otpStore.get(email);
    const pending = pendingUsers.get(email);

    if (!record || !pending)
      return res
        .status(400)
        .json({
          success: false,
          message: "OTP expired or signup not initiated. Please signup again.",
        });

    if (record.otp !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });

    otpStore.delete(email);
    pendingUsers.delete(email);

    const newUser = new userModel({
      email,
      name: pending.name,
      password: pending.passwordHash,
      profilePic: pending.profilePic,
      role: pending.role,
      isVerified: true,
    });

    const saved = await newUser.save();
    console.log("✅ User verified and saved:", saved.email);

    return res.json({
      success: true,
      message: "Account created successfully",
      data: { id: saved._id, email: saved.email, name: saved.name },
    });
  } catch (err) {
    console.error("🔥 verifyOtpController error:", err.stack || err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while verifying OTP" });
  }
}

// ---------- RESEND OTP ----------
async function resendOtpController(req, res) {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ success: false, message: "Email required" });

    const record = otpStore.get(email);
    const pending = pendingUsers.get(email);

    if (!pending)
      return res.status(400).json({
        success: false,
        message: "No pending signup found. Please signup first.",
      });

    if (!record) {
      const newOtp = generateOtp();
      otpStore.set(email, { otp: newOtp, createdAt: Date.now(), resendCount: 1 });
      setTimeout(() => {
        otpStore.delete(email);
        pendingUsers.delete(email);
      }, OTP_TTL);

      await transporter.sendMail({
        from: `"RK Shop" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Your RK Shop OTP (resend)",
        text: `Your new OTP is ${newOtp}. It will expire in ${Math.round(
          OTP_TTL / 60000
        )} minutes.`,
      });

      return res.json({ success: true, message: "OTP resent successfully." });
    }

    if (record.resendCount >= RESEND_LIMIT) {
      return res
        .status(429)
        .json({ success: false, message: "Resend limit reached. Please signup again." });
    }

    const newOtp = generateOtp();
    record.otp = newOtp;
    record.createdAt = Date.now();
    record.resendCount += 1;
    otpStore.set(email, record);

    await transporter.sendMail({
      from: `"RK Shop" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your RK Shop OTP (resend)",
      text: `Your new OTP is ${newOtp}. It will expire in ${Math.round(
        OTP_TTL / 60000
      )} minutes.`,
    });

    console.log("🔁 OTP resent for", email);
    return res.json({ success: true, message: "OTP resent successfully." });
  } catch (err) {
    console.error("🔥 resendOtpController error:", err.stack || err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while resending OTP" });
  }
}

module.exports = {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
};
