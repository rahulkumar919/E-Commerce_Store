const trendingSearchModel = require("../../models/trendingSearchModel");

async function updateTrendingSearch(req, res) {
  try {
    const { _id, keyword, displayOrder, isActive } = req.body;

    if (!_id) {
      throw new Error("Trending search ID is required");
    }

    const updateData = {};
    if (keyword) updateData.keyword = keyword;
    if (displayOrder !== undefined) updateData.displayOrder = displayOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSearch = await trendingSearchModel.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );

    if (!updatedSearch) {
      throw new Error("Trending search not found");
    }

    res.json({
      data: updatedSearch,
      message: "Trending search updated successfully",
      success: true,
      error: false,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = updateTrendingSearch;
