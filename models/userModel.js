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
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: String,
  profilePic: String,
  role: String
}, {
  timestamps: true
});

// Create the model
const userModel = mongoose.model("user", userSchema);

// Export it
module.exports = userModel;
