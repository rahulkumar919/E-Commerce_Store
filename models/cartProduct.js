const mongoose = require("mongoose");

const cardProduct= new mongoose.Schema(
  {
    productId : String ,
    quantity : Number ,
    userId :String
   
  },
  {
    timestamps: true,
  }
);

const addToCart = mongoose.model("cardProduct", cardProduct);

module.exports =addToCart;
