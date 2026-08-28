async function getCart({ userId, CartModel }) {
  if (!userId)
    return { error: "User authentication is required to view the cart" };
  const items = await CartModel.find({ userId }).populate("productId").lean();
  return {
    items: items
      .filter((item) => item.productId)
      .map((item) => ({
        _id: item._id,
        productId: item.productId._id,
        name: item.productId.productName,
        quantity: item.quantity,
        price: item.productId.selling ?? item.productId.price,
      })),
  };
}

module.exports = { getCart };
