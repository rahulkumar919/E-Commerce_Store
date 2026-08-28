const Banner = require("../../models/bannerModel");

const getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });

    res.json({
      success: true,
      error: false,
      data: banners,
      message: "Banners fetched successfully",
    });
  } catch (err) {
    console.error("❌ Get banners error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to fetch banners",
    });
  }
};

module.exports = getAllBanners;
