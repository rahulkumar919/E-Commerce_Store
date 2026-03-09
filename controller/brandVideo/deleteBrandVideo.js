const BrandVideo = require('../../models/brandVideoModel');

async function deleteBrandVideo(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required"
      });
    }

    const video = await BrandVideo.findByIdAndDelete(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Video deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting brand video:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = deleteBrandVideo;
