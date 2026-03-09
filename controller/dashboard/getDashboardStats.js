const Order = require('../../models/orderModel');
const User = require('../../models/userModel');
const Product = require('../../models/productModel');

async function getDashboardStats(req, res) {
  try {
    // Get current date and 6 months ago
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Total Revenue (all paid orders)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    // Total Paid Orders
    const totalPaidOrders = await Order.countDocuments({ paymentStatus: 'paid' });

    // Total Clients (users)
    const totalClients = await User.countDocuments();

    // Active Products
    const activeProducts = await Product.countDocuments({ isAvailable: true });

    // Revenue Trends (Last 6 Months)
    const revenueTrends = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Recent Orders (Last 10)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .select('orderId totalAmount paymentStatus createdAt userId');

    // Top Selling Products
    const topProducts = await Order.aggregate([
      {
        $match: { paymentStatus: 'paid' }
      },
      {
        $unwind: '$products'
      },
      {
        $group: {
          _id: '$products.productId',
          totalSold: { $sum: '$products.quantity' },
          revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      {
        $sort: { totalSold: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      {
        $unwind: '$productDetails'
      },
      {
        $project: {
          productName: '$productDetails.productName',
          productImage: { $arrayElemAt: ['$productDetails.productImage', 0] },
          price: '$productDetails.sellingPrice',
          totalSold: 1,
          revenue: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalRevenue,
          totalPaidOrders,
          totalClients,
          activeProducts
        },
        revenueTrends,
        recentOrders,
        topProducts
      }
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = getDashboardStats;
