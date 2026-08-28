const productModel = require("../../models/productModel");
const permissionProduct = require("../../helpers/permission");

const updateProduct = async (req, res) => {
  try {
    const session = req.userId;

    // Permission check
    const isAllowed = await permissionProduct(session);
    if (!isAllowed) {
      return res.status(403).json({
        message: "Permission Denied. Only admin can update products.",
        success: false,
        error: true,
      });
    }

    const { _id, ...updateData } = req.body;

    if (!_id) {
      return res.status(400).json({
        message: "Product ID is required",
        success: false,
        error: true,
      });
    }

    // Update product
    const updatedProduct = await productModel.findByIdAndUpdate(
      _id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    res.status(200).json({
      message: "Product updated successfully",
      success: true,
      error: false,
      data: updatedProduct,
    });
  } catch (err) {
    console.error("❌ Error updating product:", err.message);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = updateProduct;
