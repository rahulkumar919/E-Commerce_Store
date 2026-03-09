const trendingSearchModel = require("../../models/trendingSearchModel");

async function getTrendingSearches(req, res) {
  try {
    const trendingSearches = await trendingSearchModel
      .find({ isActive: true })
      .sort({ displayOrder: 1, clickCount: -1 })
      .limit(10);

    res.json({
      message: "Trending searches fetched successfully",
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

module.exports = getTrendingSearches;
