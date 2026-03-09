const SiteSettings = require("../../models/siteSettings");

const updateSiteSettings = async (req, res) => {
  try {
    const currentUser = req.user?._id || req.userId;

    const {
      siteName,
      siteEmail,
      sitePhone,
      siteAddress,
      socialLinks,
      seoSettings,
      showBlogInNav,
      showLocationInHeader,
    } = req.body;

    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = new SiteSettings();
    }

    // Update top-level fields
    if (siteName !== undefined) settings.siteName = siteName;
    if (siteEmail !== undefined) settings.siteEmail = siteEmail;
    if (sitePhone !== undefined) settings.sitePhone = sitePhone;
    if (siteAddress !== undefined) settings.siteAddress = siteAddress;
    if (showBlogInNav !== undefined) settings.showBlogInNav = showBlogInNav;
    if (showLocationInHeader !== undefined) settings.showLocationInHeader = showLocationInHeader;

    // Deep merge nested socialLinks
    if (socialLinks && typeof socialLinks === "object") {
      settings.socialLinks = {
        facebook: socialLinks.facebook ?? settings.socialLinks?.facebook ?? "",
        twitter: socialLinks.twitter ?? settings.socialLinks?.twitter ?? "",
        instagram: socialLinks.instagram ?? settings.socialLinks?.instagram ?? "",
        linkedin: socialLinks.linkedin ?? settings.socialLinks?.linkedin ?? "",
        youtube: socialLinks.youtube ?? settings.socialLinks?.youtube ?? "",
        github: socialLinks.github ?? settings.socialLinks?.github ?? "",
      };
    }

    // Deep merge nested seoSettings
    if (seoSettings && typeof seoSettings === "object") {
      settings.seoSettings = {
        metaTitle: seoSettings.metaTitle ?? settings.seoSettings?.metaTitle ?? "",
        metaDescription: seoSettings.metaDescription ?? settings.seoSettings?.metaDescription ?? "",
        metaKeywords: seoSettings.metaKeywords ?? settings.seoSettings?.metaKeywords ?? "",
      };
    }

    settings.updatedBy = currentUser;

    // Use markModified for nested objects so Mongoose detects changes
    settings.markModified("socialLinks");
    settings.markModified("seoSettings");

    await settings.save();

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
