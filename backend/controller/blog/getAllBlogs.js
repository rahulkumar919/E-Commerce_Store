const Blog = require('../../models/blogModel');

async function getAllBlogs(req, res) {
  try {
    const { published } = req.query;

    let query = {};
    
    // Filter by published status if specified
    if (published === 'true') {
      query.isPublished = true;
    } else if (published === 'false') {
      query.isPublished = false;
    }

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1, createdAt: -1 })
      .select('-content'); // Exclude full content for list view

    res.status(200).json({
      success: true,
      data: blogs,
      count: blogs.length
    });

  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = getAllBlogs;
