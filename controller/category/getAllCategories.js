const Category = require("../../models/categoryModel");
const Product = require("../../models/productModel");
const cache = require("../../config/redis");

const getAllCategories = async (req, res) => {
  try {
    const { includeSubcategories, bust } = req.query;
    const cacheKey = `categories:all:${includeSubcategories === "true" ? "with_sub" : "plain"}`;

    // Allow cache busting via ?bust=1
    if (bust !== "1") {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json({
          success: true,
          error: false,
          data: cached,
          message: "Categories fetched (cache)",
          fromCache: true,
        });
      }
    }

    // Get all categories sorted by sortOrder then name
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();

    if (includeSubcategories !== "true") {
      await cache.set(cacheKey, categories, 300);
      return res.json({
        success: true,
        error: false,
        data: categories,
        message: "Categories fetched successfully",
      });
    }

    // ── enriched path: product counts + subcategories ──────────────────────
    const allParentIds = categories.filter((c) => !c.parentCategory).map((c) => c._id);

    // Safely get product counts — wrap $toLower with $ifNull to avoid null crash
    let countMap = {};
    try {
      const productCounts = await Product.aggregate([
        {
          $match: {
            category: { $exists: true, $ne: null, $ne: "" },
          },
        },
        {
          $group: {
            _id: { $toLower: { $ifNull: ["$category", ""] } },
            count: { $sum: 1 },
          },
        },
        { $match: { _id: { $ne: "" } } },
      ]);
      productCounts.forEach((pc) => {
        if (pc._id) countMap[pc._id] = pc.count;
      });
    } catch (aggErr) {
      // Aggregation failure is non-fatal — continue without counts
      console.warn("⚠️  Product count aggregation failed (non-fatal):", aggErr.message);
    }

    // Fetch all subcategories in one query
    const subcategoryDocs = await Category.find({ parentCategory: { $in: allParentIds } })
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    const subMap = {};
    subcategoryDocs.forEach((sub) => {
      const pid = sub.parentCategory.toString();
      if (!subMap[pid]) subMap[pid] = [];
      subMap[pid].push({
        ...sub,
        productCount: countMap[sub.name?.toLowerCase()] || 0,
      });
    });

    const enriched = categories.map((category) => ({
      ...category,
      productCount: countMap[category.name?.toLowerCase()] || 0,
      subcategories: subMap[category._id?.toString()] || [],
      hasSubcategories: !!(subMap[category._id?.toString()]?.length),
    }));

    await cache.set(cacheKey, enriched, 300);

    return res.json({
      success: true,
      error: false,
      data: enriched,
      message: "Categories fetched successfully",
    });
  } catch (err) {
    console.error("❌ Get categories error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to fetch categories",
    });
  }
};

module.exports = getAllCategories;
