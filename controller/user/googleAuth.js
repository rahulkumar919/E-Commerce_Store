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

    // Check if user already exists
    let user = await userModel.findOne({ email });

    if (user) {
      // User exists, update profile pic if provided and log them in
      if (profilePic && user.profilePic !== profilePic) {
        user.profilePic = profilePic;
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
        name,
        profilePic: profilePic || "",
        role: "GENERAL",
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
