const userModel = require("../../models/userModel")

const useLogout = async (req, res) => {
  try {
    
    res.clearCookie("token", {
      httpOnly: true,
      secure: true, 
      sameSite: "none", 
    });

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
