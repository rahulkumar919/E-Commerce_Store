const productModel = require("../../models/productModel");

const deleteProduct = async (req, res) => {
  // add req, res
  try {
    const { id } = req.params;

    // Check if the product exists before deleting
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        message: "Product not found!",
        success: false,
      });
    }

    // Delete product
    await productModel.findByIdAndDelete(id);

    res.status(200).json({
      message: "🗑️ Product deleted successfully!",
      success: true,
    });
  } catch (err) {
    console.error("❌ Delete Product Error:", err.message);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
    });
  }
};

module.exports = deleteProduct;
