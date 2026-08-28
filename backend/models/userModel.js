const mongoose = require('mongoose');

// Define the schema
const userSchema = new mongoose.Schema({
  name: String,
  verificationCode: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: String,
  profilePic: String,
  role: String,
  mobile: {
    type: String,
    default: ""
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other", "Rather not say", ""],
    default: ""
  },
  dateOfBirth: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

// Create the model
const userModel = mongoose.model("user", userSchema);

// Export it
module.exports = userModel;
