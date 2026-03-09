const Category = require("../../models/categoryModel");

const createCategory = async (req, res) => {
  try {
    const { 
      name, 
      slug, 
      description, 
      metaDescription, 
      image, 
      sortOrder, 
      showInNavbar, 
      isActive,
      parentCategory 
    } = req.body;
    const currentUser = req.user?._id || req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category name is required",
      });
    }

    // Create slug from name if not provided
    const categorySlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug: categorySlug }] 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category already exists",
      });
    }

    const newCategory = new Category({
      name,
      slug: categorySlug,
      description: description || "",
      metaDescription: metaDescription || "",
      image: image || "",
      sortOrder: sortOrder || 0,
      showInNavbar: showInNavbar !== undefined ? showInNavbar : true,
      isActive: isActive !== undefined ? isActive : true,
      parentCategory: parentCategory || null,
      createdBy: currentUser,
    });

    await newCategory.save();

    res.json({
      success: true,
      error: false,
      data: newCategory,
      message: "Category created successfully",
    });
  } catch (err) {
    console.error("❌ Create category error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to create category",
    });
  }
};

module.exports = createCategory;
