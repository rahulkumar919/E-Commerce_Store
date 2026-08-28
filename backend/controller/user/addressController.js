const addressModel = require("../../models/addressModel");

// Get all addresses for a user
async function getUserAddresses(req, res) {
  try {
    const userId = req.userId;

    const addresses = await addressModel.find({ userId }).sort({ isDefault: -1, createdAt: -1 });

    res.json({
      message: "Addresses fetched successfully",
      success: true,
      error: false,
      data: addresses,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

// Add new address
async function addAddress(req, res) {
  try {
    const userId = req.userId;
    const { address, city, pincode, landmark, addressType, isDefault } = req.body;

    if (!address || !city || !pincode) {
      throw new Error("Address, city, and pincode are required");
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await addressModel.updateMany({ userId }, { isDefault: false });
    }

    const newAddress = new addressModel({
      userId,
      address,
      city,
      pincode,
      landmark: landmark || "",
      addressType: addressType || "Home",
      isDefault: isDefault || false,
    });

    const savedAddress = await newAddress.save();

    res.status(201).json({
      message: "Address added successfully",
      success: true,
      error: false,
      data: savedAddress,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

// Update address
async function updateAddress(req, res) {
  try {
    const userId = req.userId;
    const { _id, address, city, pincode, landmark, addressType, isDefault } = req.body;

    if (!_id) {
      throw new Error("Address ID is required");
    }

    // Check if address belongs to user
    const existingAddress = await addressModel.findOne({ _id, userId });
    if (!existingAddress) {
      throw new Error("Address not found");
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await addressModel.updateMany({ userId, _id: { $ne: _id } }, { isDefault: false });
    }

    const updateData = {};
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (landmark !== undefined) updateData.landmark = landmark;
    if (addressType !== undefined) updateData.addressType = addressType;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedAddress = await addressModel.findByIdAndUpdate(_id, updateData, { new: true });

    res.json({
      message: "Address updated successfully",
      success: true,
      error: false,
      data: updatedAddress,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

// Delete address
async function deleteAddress(req, res) {
  try {
    const userId = req.userId;
    const { _id } = req.body;

    if (!_id) {
      throw new Error("Address ID is required");
    }

    // Check if address belongs to user
    const existingAddress = await addressModel.findOne({ _id, userId });
    if (!existingAddress) {
      throw new Error("Address not found");
    }

    await addressModel.findByIdAndDelete(_id);

    res.json({
      message: "Address deleted successfully",
      success: true,
      error: false,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

// Set default address
async function setDefaultAddress(req, res) {
  try {
    const userId = req.userId;
    const { _id } = req.body;

    if (!_id) {
      throw new Error("Address ID is required");
    }

    // Check if address belongs to user
    const existingAddress = await addressModel.findOne({ _id, userId });
    if (!existingAddress) {
      throw new Error("Address not found");
    }

    // Unset all default addresses
    await addressModel.updateMany({ userId }, { isDefault: false });

    // Set this as default
    const updatedAddress = await addressModel.findByIdAndUpdate(
      _id,
      { isDefault: true },
      { new: true }
    );

    res.json({
      message: "Default address updated successfully",
      success: true,
      error: false,
      data: updatedAddress,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message || err,
      error: true,
      success: false,
    });
  }
}

module.exports = {
  getUserAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
