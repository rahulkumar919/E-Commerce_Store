const SiteSettings = require("../../models/siteSettings");

const updateSiteSettings = async (req, res) => {
  try {
    const currentUser = req.user?._id || req.userId;
    const updateData = { ...req.body, updatedBy: currentUser };

    let settings = await SiteSettings.findOne();

    if (!settings) {
      // Create new settings if none exist
      settings = new SiteSettings(updateData);
      await settings.save();
    } else {
      // Update existing settings
      Object.assign(settings, updateData);
      await settings.save();
    }

    res.json({
      success: true,
      error: false,
      data: settings,
      message: "Site settings updated successfully",
    });
  } catch (err) {
    console.error("❌ Update site settings error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to update site settings",
    });
  }
};

module.exports = updateSiteSettings;
