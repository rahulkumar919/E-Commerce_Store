const orderModel = require("../../models/orderModel");

const getAllOrders = async (req, res) => {
    try {
        const orders = await orderModel.find()
            .populate("userId", "name email profilePic")
            .populate("products.productId")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Order data fetched successfully",
            data: orders,
            success: true,
            error: false,
        });
    } catch (error) {
        res.status(500).json({
            message: error.message || "Failed to fetch orders",
            error: true,
            success: false,
        });
    }
};

module.exports = getAllOrders;
