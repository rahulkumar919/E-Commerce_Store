const productModel = require("../../models/productModel");

const getallProduct = async (req, res) => {
  try {
    const allProduct = await productModel.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "All products fetched successfully",
      success: true,
      error: false,
      data: allProduct,
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

module.exports = getallProduct;
