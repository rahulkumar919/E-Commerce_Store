// controller/user/otpController.js
require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
    console.log("📩 Received Login/OTP request body:", req.body);

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const existing = await userModel.findOne({ email });
    let pendingData = {};

    if (existing) {
      // User exists -> verify password
      const isMatch = await bcrypt.compare(password, existing.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: "Incorrect password." });
      }
      pendingData = { isNew: false, user: existing };
    } else {
      // User does not exist -> create new one smoothly (as signup replaced)
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = bcrypt.hashSync(password, salt);
      // Derive a name from email if not provided
      const name = email.split("@")[0];
      pendingData = { isNew: true, name, passwordHash: hashPassword, role: "GENERAL" };
    }

    // generate OTP
    const otp = generateOtp();
    otpStore.set(email, { otp, createdAt: Date.now(), resendCount: 0 });
    pendingUsers.set(email, pendingData);

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
        subject: "Your RK Shop Login OTP",
        text: `Hello,\n\nYour OTP for login is: ${otp}\nIt will expire in ${Math.round(
          OTP_TTL / 60000
        )} minutes.\n\nThank you,\nRK Shop Team`,
      });
    } catch (mailErr) {
      console.error("❌ Email send failed:", mailErr);
      return res.status(500).json({ success: false, message: "Failed to send OTP. Check SMTP credentials." });
    }

    console.log("✅ OTP sent successfully to:", email, "OTP:", otp);
    return res.json({ success: true, message: "OTP sent to your email. Please verify." });
  } catch (err) {
    console.error("🔥 sendOtpController error:", err.stack || err);
    return res.status(500).json({ success: false, message: err.message || "Server error while sending OTP" });
  }
}

// ---------- VERIFY OTP ----------
async function verifyOtpController(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });

    const record = otpStore.get(email);
    const pending = pendingUsers.get(email);

    if (!record || !pending) {
      return res.status(400).json({ success: false, message: "OTP expired or login not initiated. Please try again." });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    otpStore.delete(email);
    pendingUsers.delete(email);

    let loggedInUser;

    if (pending.isNew) {
      const newUser = new userModel({
        email,
        name: pending.name,
        password: pending.passwordHash,
        profilePic: "",
        role: pending.role,
        isVerified: true,
      });
      loggedInUser = await newUser.save();
      console.log("✅ New user verified and saved:", loggedInUser.email);
    } else {
      loggedInUser = await userModel.findOne({ email });
      console.log("✅ Existing user logged in:", loggedInUser.email);
    }

    // Now issue JWT matching what userLogin.js previously did
    const tokenData = {
      _id: loggedInUser._id,
      email: loggedInUser.email,
    };

    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
      expiresIn: 60 * 60 * 8, // 8 hours
    });

    const tokenOption = {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    };

    return res.cookie("token", token, tokenOption).status(201).json({
      message: pending.isNew ? "Account created and logged in!" : "Login Successfully via OTP",
      data: token,
      success: true,
      error: false,
    });
  } catch (err) {
    console.error("🔥 verifyOtpController error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error while verifying OTP" });
  }
}

// ---------- RESEND OTP ----------
async function resendOtpController(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const record = otpStore.get(email);
    const pending = pendingUsers.get(email);

    if (!pending) {
      return res.status(400).json({ success: false, message: "No pending login found. Please enter email and password again." });
    }

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
        text: `Your new OTP is ${newOtp}. It will expire in ${Math.round(OTP_TTL / 60000)} minutes.`,
      });

      return res.json({ success: true, message: "OTP resent successfully." });
    }

    if (record.resendCount >= RESEND_LIMIT) {
      return res.status(429).json({ success: false, message: "Resend limit reached. Please start login again." });
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
      text: `Your new OTP is ${newOtp}. It will expire in ${Math.round(OTP_TTL / 60000)} minutes.`,
    });

    console.log("🔁 OTP resent for", email);
    return res.json({ success: true, message: "OTP resent successfully." });
  } catch (err) {
    console.error("🔥 resendOtpController error:", err.stack || err);
    return res.status(500).json({ success: false, message: "Server error while resending OTP" });
  }
}

module.exports = {
  sendOtpController,
  verifyOtpController,
  resendOtpController,
};
