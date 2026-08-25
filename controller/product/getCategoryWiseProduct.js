const productModel = require("../../models/productModel");
const Category = require("../../models/categoryModel");
const cache = require("../../config/redis");

const getCategoryWiseProduct = async (req, res) => {
  try {
    const category = req.body?.category;

    if (!category) {
      return res
        .status(400)
        .json({ message: "Category is required", error: true, success: false });
    }

    const cacheKey = `products:category:${category.toLowerCase().trim()}`;

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({
        data: cached,
        message: `Found ${cached.length} products (cache)`,
        success: true,
        error: false,
        fromCache: true,
      });
    }

    // Fetch category + subcategories names in one go
    const categoryDoc = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, "i") },
    }).lean();

    let categoryNames = [category];

    if (categoryDoc) {
      const subcategories = await Category.find({
        parentCategory: categoryDoc._id,
      }).lean();
      categoryNames = [categoryDoc.name, ...subcategories.map((s) => s.name)];
    }

    // Category names come from the same collection as products, so use exact
    // values here and let MongoDB use the category index.
    const products = await productModel
      .find({
        category: { $in: categoryNames },
      })
      .select(
        "productName brandName category subcategory productImage price selling isTrending rating reviewCount badge isAvailable stock",
      )
      .sort({ isTrending: -1, createdAt: -1 })
      .lean();

    await cache.set(cacheKey, products, 180); // cache 3 min

    res.json({
      data: products,
      message: `Found ${products.length} products`,
      success: true,
      error: false,
      categoryNames, // useful for frontend to know which subcats were included
    });
  } catch (err) {
    console.error("❌ Error in getCategoryWiseProduct:", err.message);
    res.status(400).json({
      message: err.message || "Error fetching products",
      error: true,
      success: false,
    });
  }
};

module.exports = getCategoryWiseProduct;
