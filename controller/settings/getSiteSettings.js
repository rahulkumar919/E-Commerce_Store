const SiteSettings = require("../../models/siteSettings");
const cache = require("../../config/redis");

const getSiteSettings = async (req, res) => {
  try {
    const cacheKey = "site:settings";
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ success: true, error: false, data: cached, message: "Site settings fetched (cache)", fromCache: true });
    }

    let settings = await SiteSettings.findOne().lean();
    if (!settings) {
      const newSettings = new SiteSettings();
      settings = (await newSettings.save()).toObject();
    }

    await cache.set(cacheKey, settings, 600); // cache 10 min

    res.json({ success: true, error: false, data: settings, message: "Site settings fetched successfully" });
  } catch (err) {
    console.error("❌ Get site settings error:", err);
    res.status(500).json({ success: false, error: true, message: err.message || "Failed to fetch site settings" });
  }
};

module.exports = getSiteSettings;
