const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function authToken(req, res, next) {
  try {
    let token;

    // Accept token from cookie (preferred) or Authorization header
    try {
      token =
        req.cookies?.token ||
        (req.headers?.authorization || "").split(" ")[1] ||
        null;
    } catch (e) {
      token = null;
    }

    if (!token) {
      return res.status(401).json({
        message: "Please login to continue",
        error: true,
        success: false,
      });
    }

    // Fail loudly if the env var is missing — never fall back to a known string
    const secret = process.env.TOKEN_SECRET_KEY || process.env.JWT_SECRET;
    if (!secret) {
      console.error("FATAL: TOKEN_SECRET_KEY is not set in environment");
      return res.status(500).json({
        message: "Server configuration error",
        error: true,
        success: false,
      });
    }

    jwt.verify(token, secret, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          message: "Invalid or expired token",
          error: true,
          success: false,
        });
      }

      try {
        const userId = decoded?._id || decoded?.id || decoded?.userId || null;

        if (!userId) {
          return res.status(401).json({
            message: "Invalid token payload",
            error: true,
            success: false,
          });
        }

        const user = await userModel.findById(userId);
        if (!user) {
          return res.status(401).json({
            message: "User not found or deleted",
            error: true,
            success: false,
          });
        }

        req.userId = user._id.toString();
        req.user = user;
        next();
      } catch (innerErr) {
        return res.status(401).json({
          message: "Invalid or unauthorized token",
          error: true,
          success: false,
        });
      }
    });
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(500).json({
      message: err.message || "Internal Server Error",
      error: true,
      success: false,
    });
  }
}

module.exports = authToken;
