const Category = require("../../models/categoryModel");
const Product = require("../../models/productModel");

const deleteCategory = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category ID is required",
      });
    }

    // Check if category has products
    const productCount = await Product.countDocuments({ 
      category: (await Category.findById(_id))?.name 
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: `Cannot delete category. ${productCount} products are using this category.`,
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(_id);

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      error: false,
      message: "Category deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete category error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to delete category",
    });
  }
};

module.exports = deleteCategory;
