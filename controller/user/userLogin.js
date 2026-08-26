const userModel = require("../../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authCookieOptions = require("../../helpers/authCookieOptions");

async function usersigninController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      throw new Error("User not found. Please sign up first.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Incorrect password.");
    }

    if (isMatch) {
      const tokenData = {
        _id: user._id,
        email: user.email,
      };

      const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET_KEY, {
        expiresIn: 60 * 60 * 8,
      });

      const tokenOption = authCookieOptions();
      res.cookie("token", token, tokenOption).status(201).json({
        message: "Login SuccessFully",
        data: token,
        success: true,
        error: false,
      });
    } else {
      throw new Error("Please Check Password");
    }
  } catch (err) {
    res.status(400).json({
      message: err.message,
      success: false,
      error: true,
    });
  }
}

module.exports = usersigninController;
