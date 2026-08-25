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
    showMovingSticker: {
      type: Boolean,
      default: true,
    },
    movingStickerText: {
      type: String,
      default: "🚚 Delivery only available in Sitamarhi. Order fresh fruits directly to your door! 🍓",
    },
    // Marquee ticker bar — multiple messages
    showMarqueeBar: {
      type: Boolean,
      default: true,
    },
    marqueeBarBgColor: {
      type: String,
      default: "#7f1d1d", // dark red
    },
    marqueeBarTextColor: {
      type: String,
      default: "#ffffff",
    },
    marqueeMessages: {
      type: [
        {
          text: { type: String, required: true },
          emoji: { type: String, default: "🎉" },
          isActive: { type: Boolean, default: true },
        },
      ],
      default: [
        { text: "SAVE MORE WITH 10% EXTRA DISCOUNT ON PREPAID", emoji: "🏷️", isActive: true },
        { text: "GET EXTRA 10% OFF ON PREPAID ORDERS", emoji: "💳", isActive: true },
        { text: "FLAT 50% OFF STOREWIDE", emoji: "🔥", isActive: true },
      ],
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
