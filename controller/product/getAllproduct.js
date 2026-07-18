const productModel = require("../../models/productModel");
const cache = require("../../config/redis");

const CACHE_KEY = "products:all";
const CACHE_TTL = 180; // 3 minutes

const getallProduct = async (req, res) => {
  try {
    // Try cache first
    const cached = await cache.get(CACHE_KEY);
    if (cached) {
      return res.status(200).json({
        message: "All products fetched successfully",
        success: true,
        error: false,
        data: cached,
        fromCache: true,
      });
    }

    // Select only fields needed by frontend to reduce payload size
    const allProduct = await productModel
      .find()
      .select("productName brandName category subcategory productImage price selling isTrending rating reviewCount badge isAvailable stock")
      .sort({ createdAt: -1 })
      .lean();

    await cache.set(CACHE_KEY, allProduct, CACHE_TTL);

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
