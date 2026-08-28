const BrandVideo = require('../../models/brandVideoModel');

async function updateBrandVideo(req, res) {
  try {
    const { id, title, description, videoUrl, thumbnail, duration, isActive, order, category } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Video ID is required"
      });
    }

    const video = await BrandVideo.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found"
      });
    }

    if (title) video.title = title;
    if (description !== undefined) video.description = description;
    if (videoUrl) video.videoUrl = videoUrl;
    if (thumbnail) video.thumbnail = thumbnail;
    if (duration) video.duration = duration;
    if (isActive !== undefined) video.isActive = isActive;
    if (order !== undefined) video.order = order;
    if (category) video.category = category;

    await video.save();

    res.status(200).json({
      success: true,
      message: "Video updated successfully",
      data: video
    });

  } catch (error) {
    console.error("Error updating brand video:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = updateBrandVideo;
