const trendingSearchModel = require("../../models/trendingSearchModel");

async function getAllTrendingSearches(req, res) {
  try {
    const trendingSearches = await trendingSearchModel
      .find()
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
      message: "All trending searches fetched successfully",
      success: true,
      error: false,
      data: trendingSearches,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = getAllTrendingSearches;
