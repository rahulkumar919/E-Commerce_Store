const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

async function optionalAuthToken(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers?.authorization || "").split(" ")[1] ||
      null;

    if (!token) return next();

    const secret =
      process.env.JWT_SECRET || process.env.TOKEN_SECRET_KEY || "yourSecretKey";
    const decoded = jwt.verify(token, secret);
    const userId = decoded?.id || decoded?._id || decoded?.userId;
    if (!userId) return next();

    const user = await userModel.findById(userId).select("-_id").lean();
    if (user) {
      req.userId = String(userId);
      req.user = { ...user, _id: userId };
    }
  } catch {
    // Anonymous questions remain allowed; cart tools will request authentication.
  }

  return next();
}

module.exports = optionalAuthToken;
