const SiteSettings = require("../../models/siteSettings");

const getSiteSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();

    // If no settings exist, create default settings
    if (!settings) {
      settings = new SiteSettings();
      await settings.save();
    }

    res.json({
      success: true,
      error: false,
      data: settings,
      message: "Site settings fetched successfully",
    });
  } catch (err) {
    console.error("❌ Get site settings error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to fetch site settings",
    });
  }
};

module.exports = getSiteSettings;
