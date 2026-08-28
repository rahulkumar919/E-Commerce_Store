async function removeFromCart({
  productId,
  productName,
  query,
  userId,
  CartModel,
}) {
  if (!userId)
    return { error: "User authentication is required to modify the cart" };
  if (!productId && !productName && !query) {
    return { error: "productId or productName is required" };
  }

  const isObjectId = /^[a-f\d]{24}$/i.test(String(productId || ""));
  let item;
  if (isObjectId) {
    item = await CartModel.findOneAndDelete({ productId, userId }).lean();
  } else {
    const searchText = productName || query || productId;
    const escaped = searchText.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const cartItems = await CartModel.find({ userId })
      .populate("productId", "productName")
      .lean();
    const matchingItem = cartItems.find((cartItem) =>
      cartItem.productId?.productName?.match(new RegExp(escaped, "i")),
    );
    if (matchingItem) {
      item = await CartModel.findOneAndDelete({
        _id: matchingItem._id,
        userId,
      }).lean();
    }
  }

  return item
    ? { success: true, message: "Product removed from your cart" }
    : { error: "That product is not in your cart" };
}

module.exports = { removeFromCart };
