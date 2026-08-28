async function addToCart({ productId, userId, ProductModel, CartModel }) {
  if (!userId)
    return { error: "User authentication is required to modify the cart" };
  if (!productId) return { error: "productId is required" };
  const product = await ProductModel.findOne({
    _id: productId,
    isAvailable: { $ne: false },
  }).lean();
  if (!product) return { error: "Product not found or unavailable" };

  const item = await CartModel.findOneAndUpdate(
    { productId, userId },
    { $inc: { quantity: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();
  return {
    success: true,
    message: `${product.productName} added to your cart`,
    item,
  };
}

module.exports = { addToCart };
