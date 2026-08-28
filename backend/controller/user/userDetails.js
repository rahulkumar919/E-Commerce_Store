const userModel = require("../../models/userModel")

async function userDetailsController(req, res) {
  try {
    console.log("userId in details controller:", req.userId);

    const user = await userModel.findById(req.userId);

    console.log("user detailed ", user);

    res.status(200).json({
      data: user,
      error: false,
      success: true,
      message: "User Detailed  ",
    });
  } catch (err) {
    console.error("Error in userDetailsController:", err.message);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
}

module.exports = userDetailsController;
