const mongoose = require("mongoose");

const cardProduct= new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    userId: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

const addToCart = mongoose.model("cardProduct", cardProduct);

module.exports = addToCart;
