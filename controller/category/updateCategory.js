const Category = require("../../models/categoryModel");

const updateCategory = async (req, res) => {
  try {
    const { _id, name, description, image, isActive } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Category ID is required",
      });
    }

    const updateData = {};
    
    if (name) {
      updateData.name = name;
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedCategory = await Category.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      error: false,
      data: updatedCategory,
      message: "Category updated successfully",
    });
  } catch (err) {
    console.error("❌ Update category error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to update category",
    });
  }
};

module.exports = updateCategory;
