const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    metaDescription: {
      type: String,
      default: "",
      maxlength: 160,
    },
    image: {
      type: String,
      default: "",
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    showInNavbar: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      default: null, // null means it's a main category
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

// Virtual field to get subcategories
categorySchema.virtual("subcategories", {
  ref: "category",
  localField: "_id",
  foreignField: "parentCategory",
});

// Ensure virtuals are included in JSON
categorySchema.set("toJSON", { virtuals: true });
categorySchema.set("toObject", { virtuals: true });

const Category = mongoose.model("category", categorySchema);

module.exports = Category;
