const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function authToken(req, res, next) {
  try {
    let token;

    // Get token from cookie or header
    try {
      token =
        req.cookies?.token ||
        (req.headers?.authorization || "").split(" ")[1] ||
        null;
    } catch (e) {
      token = null;
    }

    // If no token found
    if (!token) {
      console.log("No token found in request");
      return res.status(401).json({
        message: "Please login to continue",
        error: true,
        success: false,
      });
    }

    //  Verify token
    const secret =
      process.env.JWT_SECRET ||
      process.env.TOKEN_SECRET_KEY ||
      "yourSecretKey";

    jwt.verify(token, secret, async (err, decoded) => {
      if (err) {
        console.log("Invalid token:", err.message);
        return res.status(401).json({
          message: "Invalid or expired token",
          error: true,
          success: false,
        });
      }

      console.log(" Decoded token:", decoded);

      const userId = decoded?.id || decoded?._id || decoded?.userId || null;

      if (!userId) {
        console.log(" userId missing in decoded token");
        return res.status(401).json({
          message: "Invalid token payload",
          error: true,
          success: false,
        });
      }

      //  Find user in DB
      const user = await userModel.findById(userId);
      if (!user) {
        console.log(" User not found in DB for:", userId);
        return res.status(401).json({
          message: "User not found or deleted",
          error: true,
          success: false,
        });
      }

      //  Attach to request
      req.userId = user._id.toString();
      req.user = user;
      console.log("Authenticated User:", user.email, "| Role:", user.role);

      next();
    });
  } catch (err) {
    console.error(" Auth Middleware Error:", err.message);
    res.status(500).json({
      message: err.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
}

module.exports = authToken;
