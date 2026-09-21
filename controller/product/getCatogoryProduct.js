const productModel = require("../../models/productModel");

/**
 * GET /api/getCatogeryData
 * Returns one representative product per category using a single aggregation.
 * Previously used N+1 queries (one findOne per category) which was very slow.
 */
const getCategoryProduct = async (req, res) => {
  try {
    // Single aggregation: group by category, pick the first product per group
    const productByCategory = await productModel.aggregate([
      {
        $match: {
          category: { $exists: true, $nin: [null, ""] },
        },
      },
      {
        $sort: { createdAt: -1 }, // newest first within each category
      },
      {
        $group: {
          _id: { $toLower: "$category" },           // case-insensitive grouping
          originalCategory: { $first: "$category" }, // preserve original casing
          product: { $first: "$$ROOT" },             // grab the full first document
        },
      },
      {
        $replaceRoot: { newRoot: "$product" }, // flatten back to product shape
      },
      {
        $sort: { category: 1 }, // alphabetical by category
      },
    ]);

    res.json({
      message: "Product categories fetched successfully",
      success: true,
      data: productByCategory,
      error: false,
    });
  } catch (err) {
    console.error("getCategoryProduct error:", err.message);
    res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = getCategoryProduct;
