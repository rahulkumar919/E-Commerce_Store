const mongoose = require("mongoose");

const siteSettingsSchema = new mongoose.Schema(
  {
    siteName: {
      type: String,
      default: "ShopHub",
    },
    siteEmail: {
      type: String,
      default: "support@shophub.com",
    },
    sitePhone: {
      type: String,
      default: "+91 123 456 7890",
    },
    siteAddress: {
      type: String,
      default: "India",
    },
    socialLinks: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      youtube: { type: String, default: "" },
      github: { type: String, default: "" },
    },
    seoSettings: {
      metaTitle: { type: String, default: "ShopHub - Your Shopping Destination" },
      metaDescription: { type: String, default: "Shop quality products at amazing prices" },
      metaKeywords: { type: String, default: "ecommerce, shopping, online store" },
    },
    showBlogInNav: {
      type: Boolean,
      default: true,
    },
    showLocationInHeader: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: String,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

const SiteSettings = mongoose.model("siteSettings", siteSettingsSchema);

module.exports = SiteSettings;
