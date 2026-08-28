const trendingSearchModel = require("../../models/trendingSearchModel");

async function createTrendingSearch(req, res) {
  try {
    const { keyword, displayOrder, isActive } = req.body;

    if (!keyword) {
      throw new Error("Keyword is required");
    }

    // Check if keyword already exists
    const existingSearch = await trendingSearchModel.findOne({ keyword });
    if (existingSearch) {
      throw new Error("This keyword already exists in trending searches");
    }

    const newTrendingSearch = new trendingSearchModel({
      keyword,
      displayOrder: displayOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedSearch = await newTrendingSearch.save();

    res.status(201).json({
      data: savedSearch,
      message: "Trending search created successfully",
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

module.exports = createTrendingSearch;
