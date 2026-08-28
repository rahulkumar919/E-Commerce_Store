const userModel = require("../models/userModel");

const permissionProduct = async (userId) => {
  try {
    if (!userId) {
      console.log(" userId missing in permissionProduct()");
      return false;
    }

    const user = await userModel.findById(userId);

    if (!user) {
      console.log(" No user found for ID:", userId);
      return false;
    }

    if (user.role === "ADMIN") {
      console.log(" Permission granted for ADMIN:", user.email);
      return true;
    }

    console.log(" User is not admin:", user.email, "| Role:", user.role);
    return false;
  } catch (err) {
    console.error(" Error checking permission:", err.message);
    return false;
  }
};

module.exports = permissionProduct;
