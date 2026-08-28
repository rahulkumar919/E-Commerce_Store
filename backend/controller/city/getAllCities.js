const cityModel = require("../../models/cityModel");

async function getAllCities(req, res) {
  try {
    const { activeOnly } = req.query;

    let query = {};
    if (activeOnly === "true") {
      query.isActive = true;
    }

    const cities = await cityModel.find(query).sort({ sortOrder: 1, name: 1 });

    res.json({
      message: "Cities fetched successfully",
      success: true,
      error: false,
      data: cities,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = getAllCities;
