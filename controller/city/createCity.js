const cityModel = require("../../models/cityModel");

async function createCity(req, res) {
  try {
    const { name, state, isActive, deliveryCharge, freeDeliveryAbove, estimatedDeliveryDays, sortOrder } = req.body;

    if (!name) {
      throw new Error("City name is required");
    }

    // Check if city already exists
    const existingCity = await cityModel.findOne({ name: name.trim() });
    if (existingCity) {
      throw new Error("City already exists");
    }

    const newCity = new cityModel({
      name: name.trim(),
      state: state?.trim() || "",
      isActive: isActive !== undefined ? isActive : true,
      deliveryCharge: deliveryCharge || 0,
      freeDeliveryAbove: freeDeliveryAbove || 500,
      estimatedDeliveryDays: estimatedDeliveryDays || "2-3 days",
      sortOrder: sortOrder || 0,
    });

    const savedCity = await newCity.save();

    res.status(201).json({
      message: "City created successfully",
      success: true,
      error: false,
      data: savedCity,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = createCity;
