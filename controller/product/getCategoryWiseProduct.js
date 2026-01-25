const productModel = require("../../models/productModel");

const getCategoryWiseProduct = async (req, res) => {
  try {
    const category = req.body?.category;

    if (!category) {
      throw new Error("Category is required");
    }

    const products = await productModel.find({ category });

    res.json({
      data: products,
      message: "Products fetched successfully",
      success: true,
      error: false,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || "Error fetching products",
      error: true,
      success: false,
    });
  }
};

module.exports = getCategoryWiseProduct;
