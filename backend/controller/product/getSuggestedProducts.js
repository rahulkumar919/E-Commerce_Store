const productModel = require("../../models/productModel");

// Track a product view (increment viewCount)
const trackProductView = async (req, res) => {
  try {
    const { id } = req.params;
    await productModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    res.json({ success: true, message: "View tracked" });
  } catch (err) {
    // Silent fail — don't break the page
    res.json({ success: false });
  }
};

// Get suggested products:
// - "Based on this product": same category, sorted by viewCount desc
// - "Popular products": all products sorted by viewCount desc (different from current)
const getSuggestedProducts = async (req, res) => {
  try {
    const { productId, category } = req.query;

    if (!category || !productId) {
      return res.status(400).json({ message: "productId and category required", success: false });
    }

    // Same category, most viewed, exclude current
    const categoryBased = await productModel
      .find({ category: { $regex: new RegExp(`^${category}$`, "i") }, _id: { $ne: productId } })
      .sort({ viewCount: -1, isTrending: -1 })
      .limit(6)
      .select("productName productImage selling price category viewCount isTrending");

    // Popular across all categories, exclude current product and already shown ones
    const categoryBasedIds = categoryBased.map((p) => p._id.toString());
    const popular = await productModel
      .find({ _id: { $nin: [productId, ...categoryBasedIds] } })
      .sort({ viewCount: -1, isTrending: -1 })
      .limit(6)
      .select("productName productImage selling price category viewCount isTrending");

    res.json({
      success: true,
      data: { categoryBased, popular },
    });
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
};

module.exports = { trackProductView, getSuggestedProducts };
