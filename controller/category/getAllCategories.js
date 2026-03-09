const Category = require("../../models/categoryModel");
const Product = require("../../models/productModel");

const getAllCategories = async (req, res) => {
  try {
    const { includeSubcategories } = req.query;

    // Get all categories sorted by sortOrder (ascending) then name
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });

    // Get product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ 
          category: category.name 
        });
        
        const categoryObj = {
          ...category.toObject(),
          productCount,
        };

        // If includeSubcategories is true, get subcategories
        if (includeSubcategories === 'true') {
          const subcategories = await Category.find({ 
            parentCategory: category._id 
          }).sort({ sortOrder: 1, name: 1 });
          
          // Get product count for each subcategory
          const subcategoriesWithCount = await Promise.all(
            subcategories.map(async (subcat) => {
              const subProductCount = await Product.countDocuments({ 
                category: subcat.name 
              });
              return {
                ...subcat.toObject(),
                productCount: subProductCount,
              };
            })
          );
          
          categoryObj.subcategories = subcategoriesWithCount;
          categoryObj.hasSubcategories = subcategoriesWithCount.length > 0;
        }

        return categoryObj;
      })
    );

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
