const mongoose = require("mongoose");

const trendingSearchSchema = new mongoose.Schema(
  {
    keyword: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const trendingSearchModel = mongoose.model("trendingSearch", trendingSearchSchema);

module.exports = trendingSearchModel;
