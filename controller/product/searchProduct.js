const productModel = require("../../models/productModel");

const searchProduct = async (req, res) => {
  try {
    const query = req.query.q?.trim() || "";

    if (!query) {
      const trendingProducts = await productModel.find({ isTrending: true })
        .sort({ createdAt: -1 })
        .limit(10);

      return res.json({
        data: trendingProducts,
        message: "Trending search list",
        success: true,
        error: false,
        isTrendingList: true
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
