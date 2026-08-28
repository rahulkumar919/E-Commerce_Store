const productModel = require("../../models/productModel");

const getProductById = async (req , res) => {
  
  try {


    const { id } = req.params;


    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    res.json({
      data: product,
      message: "Product fetched successfully",
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message || "Something went wrong",
      success: false,
    });
  }
};

module.exports = getProductById;
