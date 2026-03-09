const Blog = require('../../models/blogModel');

async function updateBlog(req, res) {
  try {
    const { id, title, excerpt, content, image, author, category, tags, isPublished, metaTitle, metaDescription, views } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Blog ID is required"
      });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      });
    }

    // Update fields
    if (title) {
      blog.title = title;
      // Update slug if title changed
      blog.slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (image) blog.image = image;
    if (author) blog.author = author;
    if (category) blog.category = category;
    if (tags) blog.tags = tags;
    if (isPublished !== undefined) blog.isPublished = isPublished;
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;
    if (views !== undefined && views !== null && views !== "") blog.views = Number(views);

    await blog.save();

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog
    });

  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
}

module.exports = updateBlog;
