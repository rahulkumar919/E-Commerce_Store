const Banner = require("../../models/bannerModel");

const deleteBanner = async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Banner ID is required",
      });
    }

    const deletedBanner = await Banner.findByIdAndDelete(_id);

    if (!deletedBanner) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "Banner not found",
      });
    }

    res.json({
      success: true,
      error: false,
      message: "Banner deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete banner error:", err);
    res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Failed to delete banner",
    });
  }
};

module.exports = deleteBanner;
