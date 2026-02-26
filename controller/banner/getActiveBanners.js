const Banner = require("../../models/bannerModel");

const getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      error: false,
      data: banners,
      message: "Active banners fetched successfully",
    });
  } catch (err) {
    console.error("❌ Get active banners error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to fetch active banners",
    });
  }
};

module.exports = getActiveBanners;
