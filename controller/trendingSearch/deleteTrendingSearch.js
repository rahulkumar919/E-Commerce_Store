const trendingSearchModel = require("../../models/trendingSearchModel");

async function deleteTrendingSearch(req, res) {
  try {
    const { _id } = req.body;

    if (!_id) {
      throw new Error("Trending search ID is required");
    }

    const deletedSearch = await trendingSearchModel.findByIdAndDelete(_id);

    if (!deletedSearch) {
      throw new Error("Trending search not found");
    }

    res.json({
      message: "Trending search deleted successfully",
      success: true,
      error: false,
      data: deletedSearch,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = deleteTrendingSearch;
