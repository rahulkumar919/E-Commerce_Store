const Blog = require('../../models/blogModel');

async function createBlog(req, res) {
  try {
    const { title, excerpt, content, image, author, category, tags, isPublished, metaTitle, metaDescription } = req.body;

    // Validate required fields
    if (!title || !excerpt || !content || !image) {
      return res.status(400).json({
        success: false,
        message: "Title, excerpt, content, and image are required"
      });
    }

    // Create slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({
        success: false,
        message: "A blog with this title already exists"
      });
    }

    const newBlog = new Blog({
      title,
      slug,
      excerpt,
      content,
      image,
      author: author || 'Admin',
      category: category || 'General',
      tags: tags || [],
      isPublished: isPublished !== undefined ? isPublished : true,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt
    });

    await newBlog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: newBlog
    });

  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = createBlog;
