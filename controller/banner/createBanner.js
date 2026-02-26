const Banner = require("../../models/bannerModel");

const createBanner = async (req, res) => {
  try {
    const { title, description, image, mobileImage, link, order } = req.body;
    const currentUser = req.user?._id || req.userId;

    if (!title || !image) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Title and image are required",
      });
    }

    const newBanner = new Banner({
      title,
      description: description || "",
      image,
      mobileImage: mobileImage || image,
      link: link || "",
      order: order || 0,
      createdBy: currentUser,
    });

    await newBanner.save();

    res.json({
      success: true,
      error: false,
      data: newBanner,
      message: "Banner created successfully",
    });
  } catch (err) {
    console.error("❌ Create banner error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to create banner",
    });
  }
};

module.exports = createBanner;
