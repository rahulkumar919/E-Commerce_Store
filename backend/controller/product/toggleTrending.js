const productModel = require("../../models/productModel");

const toggleTrending = async (req, res) => {
    try {
        const { productId, isTrending } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false,
            });
        }

        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            { isTrending },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found",
                error: true,
                success: false,
            });
        }

        res.status(200).json({
            message: `Product marked as ${isTrending ? 'trending' : 'not trending'}`,
            data: updatedProduct,
            success: true,
            error: false,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message || "Something went wrong",
            error: true,
            success: false,
        });
    }
};

module.exports = toggleTrending;
