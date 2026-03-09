const cityModel = require("../../models/cityModel");

async function updateCity(req, res) {
  try {
    const { _id, name, state, isActive, deliveryCharge, freeDeliveryAbove, estimatedDeliveryDays, sortOrder } = req.body;

    if (!_id) {
      throw new Error("City ID is required");
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (deliveryCharge !== undefined) updateData.deliveryCharge = deliveryCharge;
    if (freeDeliveryAbove !== undefined) updateData.freeDeliveryAbove = freeDeliveryAbove;
    if (estimatedDeliveryDays !== undefined) updateData.estimatedDeliveryDays = estimatedDeliveryDays;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const updatedCity = await cityModel.findByIdAndUpdate(_id, updateData, { new: true });

    if (!updatedCity) {
      throw new Error("City not found");
    }

    res.json({
      message: "City updated successfully",
      success: true,
      error: false,
      data: updatedCity,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = updateCity;
