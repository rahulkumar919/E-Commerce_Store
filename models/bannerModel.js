const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: true,
    },
    mobileImage: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      ref: "user",
    },
  },
  {
    timestamps: true,
  }
);

const Banner = mongoose.model("banner", bannerSchema);

module.exports = Banner;
