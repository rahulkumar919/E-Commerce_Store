const productModel = require("../../models/productModel");

const searchProduct = async (req, res) => {
  try {
    const query = req.query.q?.trim() || "";

    if (!query) {
      return res.json({
        data: [],
        message: "Empty search query",
        success: true,
        error: false,
      });
    }

    const regex = new RegExp(query, "i");

    const product = await productModel.find({
      $or: [
        { productName: regex },
        { category: regex },
        { brandName: regex },
      ],
    });

    res.json({
      data: product,
      message: "Search Product list",
      success: true,
      error: false,
    });
  } catch (err) {
    res.json({
      message: err.message || "Something went wrong",
      error: true,
      success: false,
    });
  }
};

module.exports = searchProduct;
