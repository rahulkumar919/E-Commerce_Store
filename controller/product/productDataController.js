const productModel = require("../../models/productModel");
const permissionProduct = require("../../helpers/permission");
const { notifyNewProduct } = require("../../services/notificationService");

const productData = async (req, res) => {
  try {
    console.log("🔹 req.userId =", req.userId);
    console.log("🔹 req.user =", req.user?.email, "| role:", req.user?.role);

    const session = req.userId;

    // Permission check
    const isAllowed = await permissionProduct(session);
    if (!isAllowed) {
      console.log(" Permission Denied for userId:", session);
      return res.status(403).json({
        message: "Permission Denied. Only admin can upload products.",
        success: false,
        error: true,
      });
    }

    // ✅ Save Product(s)
    if (Array.isArray(req.body)) {
      const savedProducts = await productModel.insertMany(req.body);
      
      // Send notifications for each new product (async, don't wait)
      savedProducts.forEach((product) => {
        notifyNewProduct(product).catch(err => 
          console.error("Notification error:", err)
        );
      });
      
      res.status(201).json({
        message: `${savedProducts.length} Products Uploaded Successfully. Notifications sent to users.`,
        success: true,
        error: false,
        data: savedProducts,
      });
    } else {
      const productdata = new productModel(req.body);
      const saveproduct = await productdata.save();

      // Send notifications to all users (async, don't block response)
      notifyNewProduct(saveproduct).catch(err => 
        console.error("Notification error:", err)
      );

      res.status(201).json({
        message: "Product Data Uploaded Successfully. Notifications sent to users.",
        success: true,
        error: false,
        data: saveproduct,
      });
    }
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
