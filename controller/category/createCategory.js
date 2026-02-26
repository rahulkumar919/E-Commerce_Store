const Category = require("../../models/categoryModel");

const createCategory = async (req, res) => {
  try {
    const { name, description, image } = req.body;
    const currentUser = req.user?._id || req.userId;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category name is required",
      });
    }

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      $or: [{ name }, { slug }] 
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
      slug,
      description: description || "",
      image: image || "",
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
