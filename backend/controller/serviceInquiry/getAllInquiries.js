const serviceInquiryModel = require("../../models/serviceInquiryModel");
const permissionProduct = require("../../helpers/permission");

const getAllInquiries = async (req, res) => {
  try {
    const session = req.userId;

    // Permission check - only admin can view inquiries
    const isAllowed = await permissionProduct(session);
    if (!isAllowed) {
      return res.status(403).json({
        message: "Permission Denied. Only admin can view inquiries.",
        success: false,
        error: true,
      });
    }

    const inquiries = await serviceInquiryModel
      .find()
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Inquiries fetched successfully",
      success: true,
      error: false,
      data: inquiries,
    });
  } catch (error) {
    console.error("❌ Error fetching inquiries:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = getAllInquiries;
