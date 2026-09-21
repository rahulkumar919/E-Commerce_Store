const mongoose = require("mongoose");
const productModel = require("../../models/productModel");

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format before hitting the DB — returns 400 instead of a
    // confusing 500 CastError when the id string is malformed.
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid product ID",
        success: false,
        error: true,
      });
    }

    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
        error: true,
      });
    }

    res.json({
      data: product,
      message: "Product fetched successfully",
      success: true,
      error: false,
    });
  } catch (err) {
    console.error("getProductById error:", err.message);
    res.status(500).json({
      message: err.message || "Something went wrong",
      success: false,
      error: true,
    });
  }
};

module.exports = getProductById;
