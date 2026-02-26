const Category = require("../../models/categoryModel");
const Product = require("../../models/productModel");

const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category.name 
        });
        
        return {
          ...category.toObject(),
          productCount,
        };
      })
    );

    res.json({
      success: true,
      error: false,
      data: categoriesWithCount,
      message: "Categories fetched successfully",
    });
  } catch (err) {
    console.error("❌ Get categories error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to fetch categories",
    });
  }
};

module.exports = getAllCategories;
