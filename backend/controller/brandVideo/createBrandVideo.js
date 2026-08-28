const BrandVideo = require('../../models/brandVideoModel');

async function createBrandVideo(req, res) {
  try {
    const { title, description, videoUrl, thumbnail, duration, isActive, order, category } = req.body;

    if (!title || !videoUrl || !thumbnail) {
      return res.status(400).json({
        success: false,
        message: "Title, video URL, and thumbnail are required"
      });
    }

    const newVideo = new BrandVideo({
      title,
      description,
      videoUrl,
      thumbnail,
      duration,
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      category: category || 'Brand'
    });

    await newVideo.save();

    res.status(201).json({
      success: true,
      message: "Brand video created successfully",
      data: newVideo
    });

  } catch (error) {
    console.error("Error creating brand video:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = createBrandVideo;
