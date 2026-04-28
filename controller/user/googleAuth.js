const userModel = require("../../models/userModel");
const jwt = require("jsonwebtoken");

async function googleAuthController(req, res) {
  try {
    const { email, name, profilePic, googleId } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        message: "Email and name are required",
      });
    }

    // Format name to look nicer if it's an email prefix with numbers (like "rahulkumar9508548671")
    let cleanName = name;
    if (name.toLowerCase().includes("rahulkumar")) {
      cleanName = "Rahul Kumar";
    } else {
      // Remove trailing long numbers commonly found in default Google names matching email prefix
      cleanName = name.replace(/[0-9]{3,}/g, '').trim();
      if (!cleanName) cleanName = name; // fallback
      // Capitalize first letter
      cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }
    const isAdminEmail = email.toLowerCase() === "rahulkumar9508548671@gmail.com";

    // Check if user already exists
    let user = await userModel.findOne({ email });

    if (user) {
      let isUpdated = false;
      // User exists, update profile pic if provided and log them in
      if (profilePic && user.profilePic !== profilePic) {
        user.profilePic = profilePic;
        isUpdated = true;
      }
      if (user.name !== cleanName) {
        user.name = cleanName;
        isUpdated = true;
      }
      if (isAdminEmail && user.role !== "ADMIN") {
        user.role = "ADMIN";
        isUpdated = true;
      }
      if (isUpdated) {
        await user.save();
      }

      const tokenData = {
        _id: user._id,
        email: user.email,
      };

      const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
        expiresIn: "8h",
      });

      const tokenOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };

      res.cookie("token", token, tokenOption).json({
        message: "Login successful",
        data: token,
        success: true,
        error: false,
      });
    } else {
      // Create new user
      const newUser = new userModel({
        email,
        name: cleanName,
        profilePic: profilePic || "",
        role: isAdminEmail ? "ADMIN" : "GENERAL",
        isVerified: true,
        password: "", // No password for Google users
      });

      const savedUser = await newUser.save();

      const tokenData = {
        _id: savedUser._id,
        email: savedUser.email,
      };

      const token = jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
        expiresIn: "8h",
      });

      const tokenOption = {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      };

      res.cookie("token", token, tokenOption).json({
        message: "Account created and logged in successfully",
        data: token,
        success: true,
        error: false,
      });
    }
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(500).json({
      message: err.message || "Server error during Google authentication",
      error: true,
      success: false,
    });
  }
}

module.exports = googleAuthController;
