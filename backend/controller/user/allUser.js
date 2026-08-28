const userModel = require("../../models/userModel")


async function AllUSer(req, res) {
  try {
    console.log("All User Details", req.userId); 
    const alluser = await userModel.find()

    res.status(200).json({
      data : alluser ,
      success: true,
      message: "All user details fetched successfully",
      error : false 
    });
  } catch (err) {
    console.error("Error in AllUser controller:", err.message);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
}

module.exports = AllUSer;
