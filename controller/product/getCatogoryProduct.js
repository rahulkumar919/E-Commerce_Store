const productModel = require("../../models/productModel");

const getCategoryProduct = async (req, res) => {
  try {
    // Step 1: Get distinct categories
    const productCategories = await productModel.distinct("category");
    console.log("Categories:", productCategories);

    // Step 2: Array to store one product from each category
    const productByCategory = [];

    // Step 3: Loop through all categories
    for (const category of productCategories) {
      const product = await productModel.findOne({ category }); // find one product of that category
      if (product) {
        productByCategory.push(product);
      }
    }

    // Step 4: Send response to frontend
    res.json({
      message: "Product categories fetched successfully",
      success: true,
      data: productByCategory,
      error: false,
    });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = getCategoryProduct;
