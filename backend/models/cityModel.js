const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    freeDeliveryAbove: {
      type: Number,
      default: 500,
    },
    estimatedDeliveryDays: {
      type: String,
      default: "2-3 days",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const cityModel = mongoose.model("city", citySchema);

module.exports = cityModel;
