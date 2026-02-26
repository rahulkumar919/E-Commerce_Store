const Banner = require("../../models/bannerModel");

const updateBanner = async (req, res) => {
  try {
    const { _id, title, description, image, mobileImage, link, order, isActive } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Banner ID is required",
      });
    }

    const updateData = {};
    
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (image) updateData.image = image;
    if (mobileImage !== undefined) updateData.mobileImage = mobileImage;
    if (link !== undefined) updateData.link = link;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedBanner = await Banner.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );

    if (!updatedBanner) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Banner not found",
      });
    }

    res.json({
      success: true,
      error: false,
      data: updatedBanner,
      message: "Banner updated successfully",
    });
  } catch (err) {
    console.error("❌ Update banner error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to update banner",
    });
  }
};

module.exports = updateBanner;
