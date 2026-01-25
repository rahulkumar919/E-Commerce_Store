const productModel = require("../../models/productModel");
const permissionProduct = require("../../helpers/permission");

const productData = async (req, res) => {
  try {
    console.log("🔹 req.userId =", req.userId);
    console.log("🔹 req.user =", req.user?.email, "| role:", req.user?.role);

    const session = req.userId;

    // 🔐 Permission check
    const isAllowed = await permissionProduct(session);
    if (!isAllowed) {
      console.log(" Permission Denied for userId:", session);
      return res.status(403).json({
        message: "Permission Denied. Only admin can upload products.",
        success: false,
        error: true,
      });
    }

    // ✅ Save Product
    const productdata = new productModel(req.body);
    const saveproduct = await productdata.save();

    res.status(201).json({
      message: "Product Data Uploaded Successfully",
      success: true,
      error: false,
      data: saveproduct,
    });
  } catch (err) {
    console.error("❌ Error uploading product:", err.message);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = productData;
