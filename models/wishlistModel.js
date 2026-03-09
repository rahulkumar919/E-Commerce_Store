const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user can't add the same product twice
wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

const wishlistModel = mongoose.model("wishlist", wishlistSchema);

module.exports = wishlistModel;
