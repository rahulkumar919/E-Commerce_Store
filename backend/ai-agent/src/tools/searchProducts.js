function toProduct(product) {
  return {
    _id: product._id,
    name: product.productName,
    price: product.selling ?? product.price,
    image: product.productImage?.[0] || "",
    category: product.category,
    description: product.description || "",
    stock: product.stock,
  };
}

async function searchProducts({ query, ProductModel }) {
  if (!query?.trim()) return { products: [] };
  const terms = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const usefulTerms = terms.filter((term) => term.length > 2).slice(0, 8);
  const regex = usefulTerms.length
    ? new RegExp(usefulTerms.join("|"), "i")
    : null;
  let products = [];

  if (regex) {
    products = await ProductModel.find({
      $or: [
        { productName: regex },
        { category: regex },
        { description: regex },
      ],
      isAvailable: { $ne: false },
    })
      .sort({ isTrending: -1, isBestseller: -1, viewCount: -1 })
      .limit(8)
      .lean();
  }

  if (!products.length) {
    products = await ProductModel.find({ isAvailable: { $ne: false } })
      .sort({ isTrending: -1, isBestseller: -1, viewCount: -1 })
      .limit(6)
      .lean();
  }

  return { products: products.map(toProduct) };
}

module.exports = { searchProducts, toProduct };
