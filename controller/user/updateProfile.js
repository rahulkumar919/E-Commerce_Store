const userModel = require("../../models/userModel");

async function updateProfile(req, res) {
  try {
    const userId = req.userId;
    const { name, mobile, gender, dateOfBirth } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");

    if (!updatedUser) {
      throw new Error("User not found");
    }

    res.json({
      message: "Profile updated successfully",
      success: true,
      error: false,
      data: updatedUser,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = updateProfile;
