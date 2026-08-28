const { toProduct } = require("./searchProducts");

async function getProduct({ productId, ProductModel }) {
  if (!productId) return { error: "productId is required" };
  const product = await ProductModel.findById(productId).lean();
  return product
    ? { product: toProduct(product) }
    : { error: "Product not found" };
}

module.exports = { getProduct };
