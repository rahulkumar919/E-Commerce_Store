const productModel = require("../../models/productModel");
const cache = require("../../config/redis");

const searchProduct = async (req, res) => {
  try {
    const query = req.query.q?.trim() || "";

    if (!query) {
      const cacheKey = "products:trending";
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json({ data: cached, message: "Trending search list", success: true, error: false, isTrendingList: true, fromCache: true });
      }

      const trendingProducts = await productModel
        .find({ isTrending: true })
        .select("productName brandName category productImage price selling rating badge")
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(10)
        .lean();

      await cache.set(cacheKey, trendingProducts, 300);

      return res.json({ data: trendingProducts, message: "Trending search list", success: true, error: false, isTrendingList: true });
    }

    // Cache search results for popular queries
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ data: cached, message: "Search Product list", success: true, error: false, fromCache: true });
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const products = await productModel
      .find({
        $or: [
          { productName: regex },
          { category: regex },
          { brandName: regex },
          { description: regex },
        ],
      })
      .select("productName brandName category productImage price selling rating badge isAvailable")
      .sort({ isTrending: -1, viewCount: -1 })
      .limit(30)
      .lean();

    // Cache search results for 2 minutes
    await cache.set(cacheKey, products, 120);

    res.json({ data: products, message: "Search Product list", success: true, error: false });
  } catch (err) {
    res.json({ message: err.message || "Something went wrong", error: true, success: false });
  }
};

module.exports = searchProduct;
