const productModel = require("../../models/productModel");
const permissionProduct = require("../../helpers/permission");
const { notifyNewProduct } = require("../../services/notificationService");
const cache = require("../../config/redis");

const productData = async (req, res) => {
  try {
    const session = req.userId;

    const isAllowed = await permissionProduct(session);
    if (!isAllowed) {
      return res.status(403).json({
        message: "Permission Denied. Only admin can upload products.",
        success: false,
        error: true,
      });
    }

    if (Array.isArray(req.body)) {
      const savedProducts = await productModel.insertMany(req.body);
      
      // Invalidate product & category caches
      await Promise.all([
        cache.del("products:all"),
        cache.delPattern("products:category:*"),
        cache.delPattern("search:*"),
      ]);

      savedProducts.forEach((product) => {
        notifyNewProduct(product).catch(err => console.error("Notification error:", err));
      });
      
      res.status(201).json({
        message: `${savedProducts.length} Products Uploaded Successfully.`,
        success: true,
        error: false,
        data: savedProducts,
      });
    } else {
      const productdata = new productModel(req.body);
      const saveproduct = await productdata.save();

      // Invalidate product & category caches
      await Promise.all([
        cache.del("products:all"),
        cache.delPattern("products:category:*"),
        cache.delPattern("search:*"),
      ]);

      notifyNewProduct(saveproduct).catch(err => console.error("Notification error:", err));

      res.status(201).json({
        message: "Product Data Uploaded Successfully.",
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
