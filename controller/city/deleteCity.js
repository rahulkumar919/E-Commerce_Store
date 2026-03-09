const cityModel = require("../../models/cityModel");

async function deleteCity(req, res) {
  try {
    const { _id } = req.body;

    if (!_id) {
      throw new Error("City ID is required");
    }

    const deletedCity = await cityModel.findByIdAndDelete(_id);

    if (!deletedCity) {
      throw new Error("City not found");
    }

    res.json({
      message: "City deleted successfully",
      success: true,
      error: false,
      data: deletedCity,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = deleteCity;
