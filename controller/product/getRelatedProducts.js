const productModel = require("../../models/productModel");

const getRelatedProducts = async (req, res) => {
  try {

   const { productId , category } = req.query;

    console.log(" Fetching related products for category:", category);

    if (!category) {
      return res.status(400).json({
        message: "Category is required",
        error: true,
        success: false,
      });
    }
    


    // Find products in the same category, excluding the current product
    const relatedProducts = await productModel
      .find({
        category: { $regex: new RegExp(`^${category}$`, 'i') },
        _id: { $ne: productId } // Exclude current product
      })
      .limit(8); // Limit to 8 related products

    console.log(` Found ${relatedProducts.length} related products`);

    res.json({
      data: relatedProducts,
      message: "Related products fetched successfully",
      success: true,
      error: false,
    });
  } catch (err) {
    console.error("❌ Error fetching related products:", err.message);
    res.status(500).json({
      message: err.message || "Error fetching related products",
      error: true,
      success: false,
    });
  }
};

module.exports = getRelatedProducts;
