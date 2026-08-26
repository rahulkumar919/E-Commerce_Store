const userModel = require("../../models/userModel");
const authCookieOptions = require("../../helpers/authCookieOptions");

const useLogout = async (req, res) => {
  try {
    res.clearCookie("token", authCookieOptions());

    return res.json({
      message: "Logged out successfully!",
      error: false,
      success: true,
      data: [],
    });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({
      message: err.message || "Server Error",
      error: true,
      success: false,
    });
  }
};

module.exports = useLogout;
