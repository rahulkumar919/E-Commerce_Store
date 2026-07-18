const Banner = require("../../models/bannerModel");
const cache = require("../../config/redis");

const getActiveBanners = async (req, res) => {
  try {
    const cacheKey = "banners:active";
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, error: false, data: cached, message: "Active banners fetched (cache)", fromCache: true });
    }

    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();

    await cache.set(cacheKey, banners, 300); // cache 5 min

    res.json({ success: true, error: false, data: banners, message: "Active banners fetched successfully" });
  } catch (err) {
    console.error("❌ Get active banners error:", err);
    res.status(500).json({ success: false, error: true, message: err.message || "Failed to fetch active banners" });
  }
};

module.exports = getActiveBanners;
