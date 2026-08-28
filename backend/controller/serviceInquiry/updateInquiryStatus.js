const serviceInquiryModel = require("../../models/serviceInquiryModel");
const permissionProduct = require("../../helpers/permission");

const updateInquiryStatus = async (req, res) => {
  try {
    const session = req.userId;

    // Permission check
    const isAllowed = await permissionProduct(session);
    if (!isAllowed) {
      return res.status(403).json({
        message: "Permission Denied. Only admin can update inquiries.",
        success: false,
        error: true,
      });
    }

    const { inquiryId, status, adminNotes } = req.body;

    if (!inquiryId || !status) {
      return res.status(400).json({
        message: "Inquiry ID and status are required",
        success: false,
        error: true,
      });
    }

    const updateData = { status };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updatedInquiry = await serviceInquiryModel.findByIdAndUpdate(
      inquiryId,
      updateData,
      { new: true }
    );

    if (!updatedInquiry) {
      return res.status(404).json({
        message: "Inquiry not found",
        success: false,
        error: true,
      });
    }

    res.status(200).json({
      message: "Inquiry updated successfully",
      success: true,
      error: false,
      data: updatedInquiry,
    });
  } catch (error) {
    console.error("❌ Error updating inquiry:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
      success: false,
      error: true,
    });
  }
};

module.exports = updateInquiryStatus;
