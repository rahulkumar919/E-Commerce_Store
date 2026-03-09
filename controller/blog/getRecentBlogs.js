const Blog = require('../../models/blogModel');

async function getRecentBlogs(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({ isPublished: true })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .select('title slug excerpt image publishedAt category');

    res.status(200).json({
      success: true,
      data: blogs
    });

  } catch (error) {
    console.error("Error fetching recent blogs:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = getRecentBlogs;
