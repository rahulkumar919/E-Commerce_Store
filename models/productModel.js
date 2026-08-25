const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: String,
    brandName: String,
    category: String,
    subcategory: String,
    productImage: [String],
    price: Number,
    selling: Number,
    description: String,
    isTrending: {
      type: Boolean,
      default: false,
    },
    // Product Details
    productDetails: {
      type: [String],
      default: [],
    },
    // Ratings & Reviews
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        reviewerName: String,
        reviewerImage: String,
        rating: Number,
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Offers & Badges
    offerText: {
      type: String,
      default: "",
    },
    badge: {
      type: String,
      enum: ["", "New Arrival", "Best Seller", "Limited Edition", "Sale"],
      default: "",
    },
    // Stock & Availability
    stock: {
      type: Number,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // Product Flags
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isBestseller: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTrendingSearch: {
      type: Boolean,
      default: false,
    },
    // View tracking for suggestions
    viewCount: {
      type: Number,
      default: 0,
    },
    // SEO Fields
    metaTitle: {
      type: String,
      default: "",
    },
    metaDescription: {
      type: String,
      default: "",
      maxlength: 160,
    },
    metaKeywords: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

productSchema.index({ category: 1, isTrending: -1, createdAt: -1 });

const productModel = mongoose.model("product", productSchema);

module.exports = productModel;
