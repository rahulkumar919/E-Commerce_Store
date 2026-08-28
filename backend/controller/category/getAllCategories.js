const Category = require("../../models/categoryModel");
const Product = require("../../models/productModel");
const cache = require("../../config/redis");

const getAllCategories = async (req, res) => {
  try {
    const { includeSubcategories } = req.query;
    const cacheKey = `categories:all:${includeSubcategories === "true" ? "with_sub" : "plain"}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, error: false, data: cached, message: "Categories fetched (cache)", fromCache: true });
    }

    // Get all categories sorted by sortOrder (ascending) then name
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();

    if (includeSubcategories !== "true") {
      // Simple path — no subcategory enrichment needed
      await cache.set(cacheKey, categories, 300); // cache 5 min
      return res.json({ success: true, error: false, data: categories, message: "Categories fetched successfully" });
    }

    // Batch fetch all product counts & subcategories in parallel
    const allParentIds = categories.filter(c => !c.parentCategory).map(c => c._id);

    const [productCounts, subcategoryMap] = await Promise.all([
      // Single aggregation for all category product counts
      Product.aggregate([
        { $group: { _id: { $toLower: "$category" }, count: { $sum: 1 } } }
      ]),
      // All subcategories in one query
      Category.find({ parentCategory: { $in: allParentIds } })
        .sort({ sortOrder: 1, name: 1 })
        .lean()
    ]);

    // Build lookup maps
    const countMap = {};
    productCounts.forEach(pc => { countMap[pc._id] = pc.count; });

    const subMap = {};
    subcategoryMap.forEach(sub => {
      const pid = sub.parentCategory.toString();
      if (!subMap[pid]) subMap[pid] = [];
      subMap[pid].push({
        ...sub,
        productCount: countMap[sub.name?.toLowerCase()] || 0,
      });
    });

    const categoriesWithCount = categories.map(category => ({
      ...category,
      productCount: countMap[category.name?.toLowerCase()] || 0,
      subcategories: subMap[category._id?.toString()] || [],
      hasSubcategories: !!(subMap[category._id?.toString()]?.length),
    }));

    await cache.set(cacheKey, categoriesWithCount, 300); // cache 5 min

    res.json({
      success: true,
      error: false,
      data: categoriesWithCount,
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
