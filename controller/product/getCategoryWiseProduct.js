const productModel = require("../../models/productModel");

const getCategoryWiseProduct = async (req, res) => {
  try {
    const category = req.body?.category;

    console.log("🔍 Requested category:", category);

    if (!category) {
      throw new Error("Category is required");
    }

    // Case-insensitive search using regex
    const products = await productModel.find({ 
      category: { $regex: new RegExp(`^${category}$`, 'i') }
    });

    console.log(`✅ Found ${products.length} products for category: ${category}`);

    res.json({
      data: products,
      message: `Found ${products.length} products`,
      success: true,
      error: false,
    });
  } catch (err) {
    console.error("❌ Error in getCategoryWiseProduct:", err.message);
    res.status(400).json({
      message: err.message || "Error fetching products",
      error: true,
      success: false,
    });
  }
};

module.exports = getCategoryWiseProduct;
