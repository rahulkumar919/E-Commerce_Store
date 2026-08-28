const BrandVideo = require('../../models/brandVideoModel');

async function getAllBrandVideos(req, res) {
  try {
    const { active } = req.query;

    let query = {};
    
    if (active === 'true') {
      query.isActive = true;
    }

    const videos = await BrandVideo.find(query).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: videos,
      count: videos.length
    });

  } catch (error) {
    console.error("Error fetching brand videos:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = getAllBrandVideos;
