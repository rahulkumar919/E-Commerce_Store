const productModel = require("../../models/productModel");
const cache = require("../../config/redis");

/**
 * GET /api/get-product
 *
 * Query params (all optional):
 *   page     {number}  – 1-based page number (default 1)
 *   limit    {number}  – items per page, 1-200 (default 20)
 *   category {string}  – filter by category name (case-insensitive)
 *   search   {string}  – substring match on productName or brandName
 *   sort     {string}  – "newest" | "oldest" | "price_asc" | "price_desc" (default "newest")
 *
 * Response adds:
 *   pagination: { page, limit, totalProducts, totalPages, hasNextPage, hasPrevPage }
 */
const getallProduct = async (req, res) => {
  try {
    const page     = Math.max(1, parseInt(req.query.page)  || 1);
    const limit    = Math.min(200, Math.max(1, parseInt(req.query.limit) || 20));
    const category = req.query.category?.trim() || "";
    const search   = req.query.search?.trim()   || "";
    const sort     = req.query.sort || "newest";
    const skip     = (page - 1) * limit;

    // ── Build filter ────────────────────────────────────────────────────────
    const filter = {};
    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, "i") };
    }
    if (search) {
      filter.$or = [
        { productName: { $regex: search, $options: "i" } },
        { brandName:   { $regex: search, $options: "i" } },
      ];
    }

    // ── Sort map ─────────────────────────────────────────────────────────────
    const sortMap = {
      newest:     { createdAt: -1 },
      oldest:     { createdAt:  1 },
      price_asc:  { selling:    1 },
      price_desc: { selling:   -1 },
    };
    const sortQuery = sortMap[sort] || sortMap.newest;

    // ── Cache key includes all params so different pages/filters cache separately
    const cacheKey = `products:paginated:${page}:${limit}:${category}:${search}:${sort}`;

    // Only use cache for first page with no filters (most common case)
    if (page === 1 && !category && !search && sort === "newest") {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.status(200).json({ ...cached, fromCache: true });
      }
    }

    // ── Run count + data queries in parallel ─────────────────────────────────
    const [totalProducts, products] = await Promise.all([
      productModel.countDocuments(filter),
      productModel
        .find(filter)
        .select(
          "productName brandName category subcategory productImage price selling " +
          "isTrending rating reviewCount badge isAvailable stock description createdAt"
        )
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    const payload = {
      message: "Products fetched successfully",
      success: true,
      error:   false,
      data:    products,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };

    // Cache first-page default result for 3 minutes
    if (page === 1 && !category && !search && sort === "newest") {
      await cache.set(cacheKey, payload, 180);
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error("getAllproduct error:", err.message);
    return res.status(500).json({
      message: err.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = getallProduct;
