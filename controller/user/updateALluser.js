const userModel = require("../../models/userModel")

async function updateALLuser(req, res) {
  try {
        const sessionUSer = req.userId ;
    const { userId, email, name, role } = req.body;

   
    const user = userModel.findById(sessionUSer) ;

    console.log(user.ROLE)

     


    const payload = {
      ...(email && { email }),
      ...(name && { name }),
      ...(role && { role }),
    };

    const updatedUser = await userModel.findByIdAndUpdate(userId, payload, {
      new: true, // returns the updated document
    });

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
        error: true,
      });
    }

    res.status(200).json({
      data: updatedUser,
      message: "User updated successfully",
      success: true,
      error: false,
    });
  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({
      message: err.message || "Server Error",
      success: false,
      error: true,
    });
  }
}

module.exports = updateALLuser;
